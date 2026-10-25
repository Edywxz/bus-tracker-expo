import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TipoRegistroEmbarque } from '../types/database';

const OFFLINE_QUEUE_KEY = '@bus_tracker:offline_boarding_queue';

export interface RegistrarEmbarqueParams {
  viagemId: string;
  alunoId: string;
  tipo: TipoRegistroEmbarque;
  latitude?: number;
  longitude?: number;
}

export interface RegistroOfflineItem extends RegistrarEmbarqueParams {
  dataHora: string;
}

/**
 * Serviço de Controle de Embarque e Desembarque (RF007, RNF005)
 * Suporta armazenamento offline temporário quando a van trafega em áreas sem sinal de internet.
 */
export class BoardingService {
  /**
   * Registra embarque ou desembarque.
   * Se houver falha de rede, enfileira localmente no AsyncStorage.
   */
  static async registrar(params: RegistrarEmbarqueParams) {
    const dataHora = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from('registros_embarque_desembarque')
        .insert({
          viagem_id: params.viagemId,
          aluno_id: params.alunoId,
          tipo: params.tipo,
          latitude: params.latitude,
          longitude: params.longitude,
          registrado_offline: false,
          data_hora: dataHora,
          sincronizado_em: dataHora,
        })
        .select()
        .single();

      if (error) throw error;
      return { sucesso: true, offline: false, dados: data };
    } catch (err) {
      // Salva localmente em caso de falha de conexão (RNF005)
      await this.enfileirarOffline({ ...params, dataHora });
      return { sucesso: true, offline: true, dados: null };
    }
  }

  /**
   * Salva o registro na fila offline do dispositivo
   */
  private static async enfileirarOffline(item: RegistroOfflineItem) {
    const filaAtual = await this.obterFilaOffline();
    filaAtual.push(item);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filaAtual));
  }

  /**
   * Obtém a lista de registros pendentes de envio
   */
  static async obterFilaOffline(): Promise<RegistroOfflineItem[]> {
    const json = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return json ? JSON.parse(json) : [];
  }

  /**
   * Sincroniza os registros offline com o banco Supabase assim que a conexão retornar
   */
  static async sincronizarFilaOffline(): Promise<{ sincronizados: number; erros: number }> {
    const fila = await this.obterFilaOffline();
    if (fila.length === 0) return { sincronizados: 0, erros: 0 };

    let sincronizados = 0;
    const pendentesAinda: RegistroOfflineItem[] = [];

    for (const item of fila) {
      try {
        const { error } = await supabase.from('registros_embarque_desembarque').insert({
          viagem_id: item.viagemId,
          aluno_id: item.alunoId,
          tipo: item.tipo,
          latitude: item.latitude,
          longitude: item.longitude,
          registrado_offline: true,
          data_hora: item.dataHora,
          sincronizado_em: new Date().toISOString(),
        });

        if (error) {
          pendentesAinda.push(item);
        } else {
          sincronizados++;
        }
      } catch {
        pendentesAinda.push(item);
      }
    }

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(pendentesAinda));
    return { sincronizados, erros: pendentesAinda.length };
  }

  /**
   * Consulta os registros de uma viagem ativa
   */
  static async listarRegistrosViagem(viagemId: string) {
    const { data, error } = await supabase
      .from('registros_embarque_desembarque')
      .select('*, alunos(nome, turma, endereco_busca, endereco_entrega)')
      .eq('viagem_id', viagemId)
      .order('data_hora', { ascending: true });

    if (error) throw error;
    return data;
  }
}
