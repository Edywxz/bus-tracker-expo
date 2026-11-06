import { supabase } from './supabase';
import {
  PessoaAutorizada, Veiculo, ViagemTransporte, ContratoServico, Mensalidade, Pagamento, TipoUsuario,
} from '../types/database';
import type { MockDataState } from './mockData';

// Cliente sem tipagem estrita: as tabelas novas (notificacoes, mensagens, calendario_escolar)
// e as RPCs não constam em types/supabase.ts. Regenere com `supabase gen types` quando quiser.
const db: any = supabase;

export type AlunoApp = MockDataState['alunos'][number];

export interface PerfilApp {
  id: string;
  nome: string;
  email: string;
  tipo: TipoUsuario;
}

export interface DadosCarregados {
  perfil: PerfilApp;
  codigoConvite: string | null;
  alunos: AlunoApp[];
  pessoasAutorizadas: PessoaAutorizada[];
  veiculo: Veiculo | null;
  viagem: ViagemTransporte | null;
  contratos: ContratoServico[];
  mensalidades: Mensalidade[];
  pagamentos: Pagamento[];
  notificacoes: MockDataState['notificacoes'];
  mensagensChat: MockDataState['mensagensChat'];
  eventosCalendario: MockDataState['eventosCalendario'];
  nomes: { transportador?: string };
  /** Para pais: dados de recebimento do transportador. Para o transportador: os próprios. */
  recebimento: { chavePix: string | null; valor: number | null; diaVencimento: number | null };
}

const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

function check<T>(res: { data: T; error: any }): T {
  if (res.error) throw res.error;
  return res.data;
}

export class DataService {
  static async carregar(userId: string): Promise<DadosCarregados> {
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);
    const hoje = new Date().toISOString().slice(0, 10);

    const [perfilR, alunosR, pessoasR, veicR, viagemR, contR, mensR, notifR, msgR, calR, regR, ausR, pagR] =
      await Promise.all([
        db.from('perfis').select('id,nome,email,tipo_usuario').eq('id', userId).single(),
        db.from('alunos').select('*').eq('ativo', true).order('nome'),
        db.from('pessoas_autorizadas').select('*').eq('ativo', true),
        db.from('veiculos').select('*').eq('ativo', true).limit(1),
        db.from('viagens').select('*').order('criado_em', { ascending: false }).limit(1),
        db.from('contratos_servico').select('*').order('criado_em', { ascending: false }),
        db.from('mensalidades').select('*').order('ano_referencia').order('mes_referencia'),
        db.from('notificacoes').select('*').order('criado_em', { ascending: false }).limit(60),
        db.from('mensagens').select('*').order('criado_em').limit(300),
        db.from('calendario_escolar').select('*').gte('data', hoje).order('data').limit(60),
        db.from('registros_embarque_desembarque').select('aluno_id,tipo,data_hora')
          .gte('data_hora', inicioDia.toISOString()).order('data_hora', { ascending: false }),
        db.from('comunicados_ausencia').select('aluno_id,periodo,motivo,data_inicio,data_fim')
          .lte('data_inicio', hoje).gte('data_fim', hoje),
        db.from('pagamentos').select('*').order('data_pagamento', { ascending: false }),
      ]);

    const p = check<any>(perfilR);
    const perfil: PerfilApp = { id: p.id, nome: p.nome, email: p.email, tipo: p.tipo_usuario };

    // Código de convite do transportador — somente o próprio registro
    let codigoConvite: string | null = null;
    if (perfil.tipo === 'TRANSPORTADOR') {
      const r = await db.from('transportadores').select('codigo_convite').eq('id', userId).maybeSingle();
      codigoConvite = r.data?.codigo_convite ?? null;
    }

    // Status do dia de cada aluno a partir dos registros e das faltas comunicadas
    const ultimoPorAluno = new Map<string, { tipo: string; data_hora: string }>();
    for (const r of (check<any[]>(regR) ?? [])) if (!ultimoPorAluno.has(r.aluno_id)) ultimoPorAluno.set(r.aluno_id, r);
    const ausentes = new Map<string, any>();
    for (const a of (check<any[]>(ausR) ?? [])) ausentes.set(a.aluno_id, a);

    const alunos: AlunoApp[] = (check<any[]>(alunosR) ?? []).map((a) => {
      const reg = ultimoPorAluno.get(a.id);
      const aus = ausentes.get(a.id);
      let statusEmbarque: AlunoApp['statusEmbarque'] = 'AGUARDANDO';
      let ultimoRegistro: string | undefined;
      if (reg) {
        statusEmbarque = reg.tipo === 'EMBARQUE' ? 'EMBARCADO' : 'DESEMBARCADO';
        ultimoRegistro = `Hoje às ${hhmm(reg.data_hora)} (${reg.tipo === 'EMBARQUE' ? 'Embarcou na van' : 'Desembarcou no destino'})`;
      } else if (aus) {
        statusEmbarque = 'AUSENTE';
        ultimoRegistro = `Falta comunicada (${aus.periodo})${aus.motivo ? `: ${aus.motivo}` : ''}`;
      }
      return { ...a, statusEmbarque, ultimoRegistro } as AlunoApp;
    });

    // Nomes de quem está vinculado (liberados pela política `perfis_select`)
    const nomes: DadosCarregados['nomes'] = {};
    const idTransp = alunos[0]?.transportador_id;
    const ids = [idTransp].filter((x): x is string => !!x && x !== userId);
    if (ids.length) {
      const r = await db.from('perfis').select('id,nome').in('id', ids);
      for (const row of r.data ?? []) {
        if (row.id === idTransp) nomes.transportador = row.nome;
      }
    }

    // Dados de recebimento (chave PIX etc.)
    let recebimento: DadosCarregados['recebimento'] = { chavePix: null, valor: null, diaVencimento: null };
    const alvoRec = perfil.tipo === 'TRANSPORTADOR' ? userId : idTransp;
    if (alvoRec) {
      const r = await db.rpc('dados_recebimento', { p_transportador: alvoRec });
      const row = r.data?.[0];
      if (row) recebimento = { chavePix: row.chave_pix ?? null, valor: row.valor_mensalidade != null ? Number(row.valor_mensalidade) : null, diaVencimento: row.dia_vencimento ?? null };
    }

    return {
      perfil,
      codigoConvite,
      recebimento,
      alunos,
      pessoasAutorizadas: check<any[]>(pessoasR) ?? [],
      veiculo: (check<any[]>(veicR) ?? [])[0] ?? null,
      viagem: (check<any[]>(viagemR) ?? [])[0] ?? null,
      contratos: check<any[]>(contR) ?? [],
      mensalidades: (check<any[]>(mensR) ?? []).map((m) => ({ ...m, valor: Number(m.valor), valor_multa_juros: Number(m.valor_multa_juros ?? 0) })),
      pagamentos: (check<any[]>(pagR) ?? []).map((x) => ({ ...x, valor_pago: Number(x.valor_pago) })),
      notificacoes: (check<any[]>(notifR) ?? []).map((n) => ({
        id: n.id, tipo: n.tipo, titulo: n.titulo, mensagem: n.mensagem, dataHora: n.criado_em, lida: n.lida,
      })),
      mensagensChat: (check<any[]>(msgR) ?? []).map((m) => ({
        id: m.id, remetenteId: m.remetente_id, remetenteNome: m.remetente_nome, destinatarioNome: '',
        texto: m.texto, dataHora: m.criado_em, origem: m.origem,
      })),
      eventosCalendario: (check<any[]>(calR) ?? []).map((e) => ({
        id: e.id, data: e.data, titulo: e.titulo, tipo: e.tipo, descricao: e.descricao ?? '',
      })),
      nomes,
    };
  }

  // ---- Ações ---------------------------------------------------------------

  static async buscarTransportador(codigo: string): Promise<{ id: string; nome: string } | null> {
    const { data, error } = await db.rpc('buscar_transportador_por_codigo', { p_codigo: codigo });
    if (error) throw error;
    return data?.[0] ?? null;
  }

  static async cadastrarAluno(p: {
    nome: string; dataNascimento: string; documento?: string; turma: string; turno: string;
    enderecoBusca: string; enderecoEntrega: string; observacoes?: string;
    codigoTransportador: string; escolaNome?: string; escolaEndereco?: string;
  }): Promise<string> {
    const { data, error } = await db.rpc('cadastrar_aluno', {
      p_nome: p.nome, p_data_nascimento: p.dataNascimento, p_documento: p.documento ?? '',
      p_turma: p.turma, p_turno: p.turno, p_endereco_busca: p.enderecoBusca,
      p_endereco_entrega: p.enderecoEntrega, p_observacoes: p.observacoes ?? '',
      p_codigo_transportador: p.codigoTransportador,
      p_escola_nome: p.escolaNome ?? null, p_escola_endereco: p.escolaEndereco ?? null,
    });
    if (error) throw error;
    return data as string;
  }

  static async registrarPagamento(mensalidadeId: string, metodo: string, transacao: string, detalhes?: unknown) {
    const { error } = await db.rpc('registrar_pagamento', {
      p_mensalidade: mensalidadeId, p_metodo: metodo, p_transacao: transacao, p_detalhes: detalhes ?? null,
    });
    if (error) throw error;
  }

  static async confirmarRecebimento(pagamentoId: string, aceitar: boolean) {
    const { error } = await db.rpc('confirmar_recebimento', { p_pagamento: pagamentoId, p_aceitar: aceitar });
    if (error) throw error;
  }

  static async comunicarAusencia(a: { alunoId: string; responsavelId: string; transportadorId: string; periodo: string; motivo: string }) {
    const hoje = new Date().toISOString().slice(0, 10);
    const { error } = await db.from('comunicados_ausencia').insert({
      aluno_id: a.alunoId, responsavel_id: a.responsavelId, transportador_id: a.transportadorId,
      data_inicio: hoje, data_fim: hoje, periodo: a.periodo, motivo: a.motivo || null,
    });
    if (error) throw error;
  }

  static async enviarMensagem(m: { canalTransportadorId: string; remetenteId: string; remetenteNome: string; origem: string; texto: string }) {
    const { error } = await db.from('mensagens').insert({
      transportador_id: m.canalTransportadorId, remetente_id: m.remetenteId,
      remetente_nome: m.remetenteNome, origem: m.origem, texto: m.texto,
    });
    if (error) throw error;
  }

  static async marcarNotificacoesLidas(userId: string) {
    const { error } = await db.from('notificacoes').update({ lida: true }).eq('usuario_id', userId).eq('lida', false);
    if (error) throw error;
  }

  static async registrarEventoRota(e: { viagemId: string; transportadorId: string; tipo: string; descricao: string; severidade: string }) {
    const { error } = await db.from('eventos_rota').insert({
      viagem_id: e.viagemId, transportador_id: e.transportadorId, tipo: e.tipo,
      descricao: e.descricao, severidade: e.severidade,
    });
    if (error) throw error;
  }

  static async adicionarPessoa(p: Omit<PessoaAutorizada, 'id' | 'ativo'>) {
    const { error } = await db.from('pessoas_autorizadas').insert(p);
    if (error) throw error;
  }

  static async removerPessoa(id: string) {
    const { error } = await db.from('pessoas_autorizadas').delete().eq('id', id);
    if (error) throw error;
  }

  static async salvarVeiculo(transportadorId: string, v: Partial<Veiculo>) {
    const { error } = await db.from('veiculos').upsert(
      { ...v, transportador_id: transportadorId }, { onConflict: 'placa' }
    );
    if (error) throw error;
  }

  static async salvarPerfil(userId: string, d: { nome?: string; telefone?: string; cpf?: string }) {
    const { error } = await db.from('perfis').update(d).eq('id', userId);
    if (error) throw error;
  }

  static async atualizarConfigTransportador(userId: string, d: { valor_mensalidade_padrao?: number; dia_vencimento_padrao?: number; chave_pix?: string | null }) {
    const { error } = await db.from('transportadores').update(d).eq('id', userId);
    if (error) throw error;
  }

  static async salvarCalendario(transportadorId: string, e: { data: string; titulo: string; tipo: string; descricao?: string }) {
    const { error } = await db.from('calendario_escolar').insert({ transportador_id: transportadorId, ...e });
    if (error) throw error;
  }

  static async removerCalendario(id: string) {
    const { error } = await db.from('calendario_escolar').delete().eq('id', id);
    if (error) throw error;
  }

  /** Assina mudanças que exigem recarregar a tela (notificações, chat, viagens, embarques, pagamentos). */
  static assinarMudancas(userId: string, onChange: () => void): () => void {
    const ch = db.channel(`app:${userId}`);
    const tabelas: [string, string | undefined][] = [
      ['notificacoes', `usuario_id=eq.${userId}`],
      ['mensagens', undefined],
      ['viagens', undefined],
      ['pagamentos', undefined],
      ['registros_embarque_desembarque', undefined],
    ];
    for (const [table, filter] of tabelas) {
      ch.on('postgres_changes', { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) }, onChange);
    }
    ch.subscribe();
    return () => { db.removeChannel(ch); };
  }
}
