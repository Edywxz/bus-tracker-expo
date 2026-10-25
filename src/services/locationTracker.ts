import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface EnviarLocalizacaoParams {
  viagemId: string;
  transportadorId: string;
  latitude: number;
  longitude: number;
  velocidade?: number;
  direcao?: number;
  precisaoMetros?: number;
}

/**
 * Serviço de Rastreamento de Localização GPS (RF003, RNF002, RNF007)
 */
export class LocationTrackerService {
  private static activeChannels: Map<string, RealtimeChannel> = new Map();

  /**
   * Transmite a telemetria GPS da van.
   * Utiliza PostGIS Point no banco e broadcast em tempo real para baixa latência.
   */
  static async enviarLocalizacao(params: EnviarLocalizacaoParams) {
    const { viagemId, transportadorId, latitude, longitude, velocidade, direcao, precisaoMetros } =
      params;

    // 1. Broadcast em tempo real para os pais/escola (baixa latência sem custo de IOPS excessivo)
    const channelName = `viagem:${viagemId}`;
    let channel = this.activeChannels.get(channelName);

    if (!channel) {
      channel = supabase.channel(channelName);
      channel.subscribe();
      this.activeChannels.set(channelName, channel);
    }

    await channel.send({
      type: 'broadcast',
      event: 'posicao_atualizada',
      payload: {
        viagemId,
        transportadorId,
        latitude,
        longitude,
        velocidade,
        direcao,
        timestamp: new Date().toISOString(),
      },
    });

    // 2. Persistência no banco Supabase com geometria PostGIS (SRID 4326)
    const pointWkt = `POINT(${longitude} ${latitude})`;

    const { error } = await supabase.from('localizacoes_gps').insert({
      viagem_id: viagemId,
      transportador_id: transportadorId,
      posicao: pointWkt,
      velocidade,
      direcao,
      precisao_metros: precisaoMetros,
    });

    if (error) {
      console.warn('Erro ao persistir localização GPS no Supabase:', error.message);
    }
  }

  /**
   * Permite que responsáveis e escolas assinem a transmissão ao vivo da van
   */
  static assinarRastreamentoViagem(
    viagemId: string,
    onPosicao: (dados: {
      latitude: number;
      longitude: number;
      velocidade?: number;
      direcao?: number;
      timestamp: string;
    }) => void
  ): () => void {
    const channelName = `viagem:${viagemId}`;
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'posicao_atualizada' }, (response) => {
        if (response.payload) {
          onPosicao(response.payload);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Inicia o trajeto de transporte (RF020)
   */
  static async iniciarViagem(params: {
    transportadorId: string;
    veiculoId: string;
    tipoViagem: 'IDA' | 'VOLTA';
    turno: 'MANHA' | 'TARDE' | 'INTEGRAL' | 'NOITE';
  }) {
    const { data, error } = await supabase
      .from('viagens')
      .insert({
        transportador_id: params.transportadorId,
        veiculo_id: params.veiculoId,
        tipo_viagem: params.tipoViagem,
        turno: params.turno,
        status: 'EM_ANDAMENTO',
        data_hora_inicio: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Finaliza o trajeto de transporte
   */
  static async finalizarViagem(viagemId: string, kmPercorrido?: number) {
    const { data, error } = await supabase
      .from('viagens')
      .update({
        status: 'CONCLUIDA',
        data_hora_fim: new Date().toISOString(),
        km_percorrido: kmPercorrido,
      })
      .eq('id', viagemId)
      .select()
      .single();

    if (error) throw error;

    // Desconecta canal realtime
    const channel = this.activeChannels.get(`viagem:${viagemId}`);
    if (channel) {
      await supabase.removeChannel(channel);
      this.activeChannels.delete(`viagem:${viagemId}`);
    }

    return data;
  }
}
