import { supabase } from './supabase';
import { MetodoPagamento, StatusMensalidade } from '../types/database';

export interface RegistrarPagamentoParams {
  mensalidadeId: string;
  metodo: MetodoPagamento;
  valorPago: number;
  transacaoId?: string;
  detalhes?: Record<string, any>;
}

/**
 * Serviço de Gestão Financeira e Pagamentos (RF005, RF006, RF012)
 */
export class PaymentService {
  /**
   * Consulta o histórico de mensalidades de um responsável (RF006)
   */
  static async obterMensalidadesResponsavel(responsavelId: string) {
    const { data, error } = await supabase
      .from('mensalidades')
      .select('*, contratos_servico(*)')
      .eq('responsavel_id', responsavelId)
      .order('data_vencimento', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Consulta as cobranças sob gestão de um transportador
   */
  static async obterMensalidadesTransportador(transportadorId: string) {
    const { data, error } = await supabase
      .from('mensalidades')
      .select('*, responsaveis(*), contratos_servico(aluno_id)')
      .eq('transportador_id', transportadorId)
      .order('data_vencimento', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Registra um pagamento (PIX, Cartão ou Boleto) e atualiza o status da mensalidade (RF005)
   */
  static async registrarPagamento(params: RegistrarPagamentoParams) {
    const { mensalidadeId, metodo, valorPago, transacaoId, detalhes } = params;

    // 1. Inserir pagamento
    const { data: pagamento, error: pagError } = await supabase
      .from('pagamentos')
      .insert({
        mensalidade_id: mensalidadeId,
        metodo,
        valor_pago: valorPago,
        transacao_id: transacaoId,
        detalhes_metodo: detalhes || {},
        status: 'CONFIRMADO',
        data_pagamento: new Date().toISOString(),
      })
      .select()
      .single();

    if (pagError) throw pagError;

    // 2. Atualizar status da mensalidade para PAGO
    const { error: mensError } = await supabase
      .from('mensalidades')
      .update({ status: 'PAGO' as StatusMensalidade })
      .eq('id', mensalidadeId);

    if (mensError) throw mensError;

    return pagamento;
  }

  /**
   * Emite os dados para visualização de recibo digital (RF012)
   */
  static async obterReciboPagamento(pagamentoId: string) {
    const { data, error } = await supabase
      .from('pagamentos')
      .select(
        `
        *,
        mensalidades (
          mes_referencia,
          ano_referencia,
          valor,
          contrato_id,
          transportador_id,
          responsavel_id
        )
      `
      )
      .eq('id', pagamentoId)
      .single();

    if (error) throw error;
    return data;
  }
}
