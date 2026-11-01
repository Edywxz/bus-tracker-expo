import React, { useState } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { type } from '../theme/type';
import { LargeTitleScreen } from '../components/ui/LargeTitleScreen';
import { AppleButton } from '../components/AppleButton';
import { TouchableScale } from '../components/ui/TouchableScale';
import { Avatar, Badge, Card, EmptyState, Group, Row, SectionLabel, statusAluno } from '../components/ui/kit';
import { useApp } from '../context/AppContext';
import { useStack } from '../navigation/Stack';
import { AbsenceSheet, AuthorizedSheet, PaySheet } from '../sheets/Sheets';
import { brl, isoToBR, nomeMes } from '../utils/format';
import { SecurityService } from '../services/security';

const TURNO: Record<string, string> = { MANHA: 'Manhã', TARDE: 'Tarde', INTEGRAL: 'Integral', NOITE: 'Noite' };

/* --------------------------------------------------------- Aluno */
export const StudentDetailScreen: React.FC<{ params?: { id: string } }> = ({ params }) => {
  const { alunos, role, pessoasAutorizadas, removerPessoaAutorizada, contratos } = useApp();
  const stack = useStack();
  const [absence, setAbsence] = useState(false);
  const [addPessoa, setAddPessoa] = useState(false);
  const a = alunos.find((x) => x.id === params?.id);
  if (!a) {
    return <LargeTitleScreen title="Aluno"><EmptyState icon="alert-circle" title="Aluno não encontrado" message="Ele pode ter sido removido." /></LargeTitleScreen>;
  }
  const st = statusAluno(a.statusEmbarque);
  const pessoas = pessoasAutorizadas.filter((p) => p.aluno_id === a.id);
  const contrato = contratos.find((c) => c.aluno_id === a.id);
  const pai = role === 'RESPONSAVEL';

  const remover = (id: string, nome: string) =>
    Alert.alert('Remover pessoa autorizada?', `${nome} não poderá mais buscar ${a.nome.split(' ')[0]}.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removerPessoaAutorizada(id).catch((e) => Alert.alert('Erro', e.message)) },
    ]);

  return (
    <LargeTitleScreen title={a.nome} subtitle={`${a.turma} · ${TURNO[a.turno]}`}
      footer={pai ? <AppleButton size="lg" variant="tonal" title="Avisar falta" onPress={() => setAbsence(true)}
        icon={<Ionicons name="calendar-outline" size={17} color={colors.accentText} />} /> : undefined}>
      <Card style={s.hero}>
        <Avatar name={a.nome} size={64} />
        <Badge label={st.label} color={st.color} bg={st.bg} icon={st.icon} />
        {a.ultimoRegistro ? <Text style={s.center}>{a.ultimoRegistro}</Text> : null}
      </Card>

      <SectionLabel>Trajeto</SectionLabel>
      <Group>
        <Row icon="home-outline" title="Embarque" subtitle={a.endereco_busca} />
        <Row icon="school-outline" title="Destino" subtitle={a.endereco_entrega} />
      </Group>

      {a.observacoes_medicas && role !== 'INSTITUICAO' ? (
        <>
          <View style={{ height: 16 }} />
          <SectionLabel>Saúde</SectionLabel>
          <Group><Row icon="medkit-outline" iconColor={colors.systemRed} iconBg={colors.systemRedLight} title="Observações" subtitle={a.observacoes_medicas} /></Group>
        </>
      ) : null}

      {role !== 'INSTITUICAO' && (
        <>
          <View style={{ height: 16 }} />
          <SectionLabel right={pai ? (
            <TouchableScale onPress={() => setAddPessoa(true)} accessibilityRole="button" accessibilityLabel="Adicionar pessoa autorizada" hitSlop={10}>
              <Text style={s.link}>Adicionar</Text>
            </TouchableScale>) : undefined}>Pessoas autorizadas</SectionLabel>
          {pessoas.length === 0 ? (
            <Card><Text style={s.muted}>Ninguém além dos responsáveis foi autorizado a buscar o aluno.</Text></Card>
          ) : (
            <Group>
              {pessoas.map((p) => (
                <Row key={p.id} left={<Avatar name={p.nome} size={40} />} title={p.nome}
                  subtitle={`${p.grau_parentesco} · ${SecurityService.maskPhone(p.telefone)}`}
                  right={pai ? (
                    <TouchableScale onPress={() => remover(p.id, p.nome)} accessibilityRole="button" accessibilityLabel={`Remover ${p.nome}`} hitSlop={10}>
                      <Ionicons name="trash-outline" size={20} color={colors.systemRed} />
                    </TouchableScale>) : undefined} />
              ))}
            </Group>
          )}
        </>
      )}

      {contrato && (
        <>
          <View style={{ height: 16 }} />
          <SectionLabel>Contrato</SectionLabel>
          <Group><Row icon="document-text-outline" title={`Contrato ${contrato.numero_contrato}`} subtitle={`${brl(contrato.valor_mensalidade)} por mês`} onPress={() => stack.push('Contract', { alunoId: a.id })} /></Group>
        </>
      )}

      <AbsenceSheet visible={absence} onClose={() => setAbsence(false)} alunoId={a.id} />
      <AuthorizedSheet visible={addPessoa} onClose={() => setAddPessoa(false)} alunoId={a.id} />
    </LargeTitleScreen>
  );
};

/* --------------------------------------------------------- Contrato */
export const ContractScreen: React.FC<{ params?: { alunoId: string } }> = ({ params }) => {
  const { contratos, alunos, nomes } = useApp();
  const c = contratos.find((x) => x.aluno_id === params?.alunoId);
  const aluno = alunos.find((x) => x.id === params?.alunoId);
  if (!c) return <LargeTitleScreen title="Contrato"><EmptyState icon="document-text" title="Sem contrato" message="O contrato é criado quando o aluno é vinculado ao motorista." /></LargeTitleScreen>;
  return (
    <LargeTitleScreen title="Contrato" subtitle={c.numero_contrato}>
      <Group>
        <Row icon="person-outline" title="Aluno" value={aluno?.nome ?? '-'} />
        <Row icon="bus-outline" title="Transportador" value={nomes.transportador ?? '-'} />
        <Row icon="cash-outline" title="Mensalidade" value={brl(c.valor_mensalidade)} />
        <Row icon="calendar-outline" title="Vencimento" value={`Dia ${c.dia_vencimento}`} />
        <Row icon="time-outline" title="Vigência" value={`${isoToBR(c.data_inicio)} a ${isoToBR(c.data_termino)}`} />
        <Row icon="shield-checkmark-outline" title="Situação" value={c.status === 'ATIVO' ? 'Ativo' : c.status} />
      </Group>
      {c.termos_condicoes ? (
        <>
          <View style={{ height: 16 }} />
          <SectionLabel>Termos</SectionLabel>
          <Card><Text style={s.terms}>{c.termos_condicoes}</Text></Card>
        </>
      ) : null}
    </LargeTitleScreen>
  );
};

/* --------------------------------------------------------- Mensalidade / recibo */
export const PaymentDetailScreen: React.FC<{ params?: { id: string } }> = ({ params }) => {
  const { mensalidades, pagamentos, role, confirmarRecebimento, alunos, contratos } = useApp();
  const stack = useStack();
  const [pay, setPay] = useState(false);
  const [busy, setBusy] = useState(false);
  const m = mensalidades.find((x) => x.id === params?.id);
  if (!m) return <LargeTitleScreen title="Mensalidade"><EmptyState icon="alert-circle" title="Não encontrada" message="Volte e tente novamente." /></LargeTitleScreen>;
  const pend = pagamentos.find((p) => p.mensalidade_id === m.id && p.status === 'PENDENTE');
  const conf = pagamentos.find((p) => p.mensalidade_id === m.id && p.status === 'CONFIRMADO');
  const contrato = contratos.find((c) => c.id === m.contrato_id);
  const aluno = alunos.find((a) => a.id === contrato?.aluno_id);
  const total = m.valor + (m.valor_multa_juros ?? 0);
  const pago = m.status === 'PAGO';
  const atrasado = m.status === 'VENCIDO';

  const confirmar = async (aceitar: boolean) => {
    setBusy(true);
    try { await confirmarRecebimento(pend!.id, aceitar); } catch (e) { Alert.alert('Erro', (e as Error).message); } finally { setBusy(false); }
  };
  const recibo = pago ? SecurityService.generateReceiptHash(m.id, m.valor, m.criado_em) : null;

  return (
    <LargeTitleScreen title={`${nomeMes(m.mes_referencia)} ${m.ano_referencia}`} subtitle={aluno?.nome}
      footer={role === 'RESPONSAVEL' && !pago && !pend ? <AppleButton size="lg" title={`Pagar ${brl(total)}`} onPress={() => setPay(true)} /> :
        role === 'TRANSPORTADOR' && pend ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <AppleButton style={{ flex: 1 }} variant="secondary" title="Não recebi" onPress={() => confirmar(false)} disabled={busy} />
            <AppleButton style={{ flex: 1 }} title="Confirmar" onPress={() => confirmar(true)} loading={busy} />
          </View>) : undefined}>
      <Card style={{ alignItems: 'center', gap: 6 }}>
        <Text style={s.amount}>{brl(total)}</Text>
        <Badge
          label={pago ? 'Pago' : pend ? 'Aguardando confirmação' : atrasado ? 'Em atraso' : 'Em aberto'}
          color={pago ? colors.systemGreenText : atrasado ? colors.systemRedText : pend ? colors.systemBlueText : colors.accentText}
          bg={pago ? colors.systemGreenLight : atrasado ? colors.systemRedLight : pend ? colors.systemBlueLight : colors.accentLight}
          icon={pago ? 'checkmark-circle' : pend ? 'hourglass' : atrasado ? 'alert-circle' : 'time'}
        />
        <Text style={s.muted}>Vencimento {isoToBR(m.data_vencimento)}</Text>
      </Card>
      <View style={{ height: 16 }} />
      <Group>
        <Row title="Mensalidade" value={brl(m.valor)} />
        {m.valor_multa_juros > 0 ? <Row title="Multa e juros" value={brl(m.valor_multa_juros)} /> : null}
        {conf ? <Row title="Forma de pagamento" value={conf.metodo === 'CARTAO' ? 'Cartão' : conf.metodo === 'BOLETO' ? 'Boleto/outro' : 'PIX'} /> : null}
        {conf ? <Row title="Pago em" value={new Date(conf.data_pagamento).toLocaleDateString('pt-BR')} /> : null}
      </Group>
      {recibo && (
        <>
          <View style={{ height: 16 }} />
          <SectionLabel>Recibo digital</SectionLabel>
          <Card><Text selectable style={s.hash}>{recibo}</Text><Text style={[s.muted, { marginTop: 6 }]}>Código de autenticação do recibo.</Text></Card>
        </>
      )}
      {contrato && (
        <>
          <View style={{ height: 16 }} />
          <Group><Row icon="document-text-outline" title="Ver contrato" onPress={() => stack.push('Contract', { alunoId: contrato.aluno_id })} /></Group>
        </>
      )}
      <PaySheet visible={pay} onClose={() => setPay(false)} mensalidade={m} />
    </LargeTitleScreen>
  );
};

const s = StyleSheet.create({
  hero: { alignItems: 'center', gap: 10, marginBottom: 18 },
  center: { ...type.footnote, color: colors.textTertiary, textAlign: 'center' },
  muted: { ...type.footnote, color: colors.textTertiary },
  link: { ...type.footnote, fontWeight: '700', color: colors.accentDark, textTransform: 'none' },
  terms: { ...type.subhead, color: colors.textSecondary },
  amount: { fontSize: 42, fontWeight: '800', letterSpacing: -1.4, color: colors.textPrimary },
  hash: { ...type.footnote, fontFamily: undefined, color: colors.textSecondary },
});
