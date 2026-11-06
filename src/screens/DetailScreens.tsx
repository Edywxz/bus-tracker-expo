import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { gap, spacing } from '../theme/tokens';
import { type } from '../theme/type';
import {
  Avatar, Button, Card, confirm, EmptyState, IconButton, ListRow, ListSection, notify, Screen, SectionFooter, SectionHeader,
  share, StatusPill, statusAluno,
} from '../components/ui/kit';
import { useApp } from '../context/AppContext';
import { go } from '../navigation/routes';
import { AbsenceSheet, AuthorizedSheet, PaySheet } from '../sheets/Sheets';
import { brl, isoToBR, nomeMes } from '../utils/format';
import { SecurityService } from '../services/security';

const TURNO: Record<string, string> = { MANHA: 'Manhã', TARDE: 'Tarde', INTEGRAL: 'Integral', NOITE: 'Noite' };

/* --------------------------------------------------------- Aluno */
export const StudentDetailScreen: React.FC<{ id?: string }> = ({ id }) => {
  const { alunos, role, pessoasAutorizadas, removerPessoaAutorizada, contratos } = useApp();
  const [absence, setAbsence] = useState(false);
  const [addPessoa, setAddPessoa] = useState(false);
  const a = alunos.find((x) => x.id === id);
  if (!a) {
    return <Screen title="Aluno"><EmptyState icon="alert" title="Aluno não encontrado" message="Ele pode ter sido removido." /></Screen>;
  }
  const st = statusAluno(a.statusEmbarque);
  const pessoas = pessoasAutorizadas.filter((p) => p.aluno_id === a.id);
  const contrato = contratos.find((c) => c.aluno_id === a.id);
  const pai = role === 'RESPONSAVEL';

  const remover = async (pid: string, nome: string) => {
    const ok = await confirm({ title: 'Remover pessoa autorizada?', message: `${nome} não poderá mais buscar ${a.nome.split(' ')[0]}.`, confirmLabel: 'Remover', destructive: true });
    if (ok) removerPessoaAutorizada(pid).catch((e) => notify('Erro', e.message));
  };

  return (
    <Screen title={a.nome.split(' ')[0]}
      footer={pai ? <Button size="lg" variant="tinted" label="Avisar falta" icon="calendar" onPress={() => setAbsence(true)} /> : undefined}>
      <Card style={s.hero}>
        <Avatar name={a.nome} size="lg" onBoard={a.statusEmbarque === 'EMBARCADO'} />
        <Text style={s.heroName}>{a.nome}</Text>
        <Text style={s.center}>{a.turma} · {TURNO[a.turno]}</Text>
        <StatusPill tone={st.tone} label={st.label} icon={st.icon} />
        {a.ultimoRegistro ? <Text style={s.center}>{a.ultimoRegistro}</Text> : null}
      </Card>

      <SectionHeader title="Trajeto" />
      <ListSection>
        <ListRow icon="home" iconTone="primary" title="Embarque" subtitle={a.endereco_busca} />
        <ListRow icon="school" iconTone="primary" title="Destino" subtitle={a.endereco_entrega} />
      </ListSection>

      {a.observacoes_medicas && role !== 'INSTITUICAO' ? (
        <>
          <SectionHeader title="Saúde" />
          <ListSection><ListRow icon="medical" iconTone="error" title="Observações" subtitle={a.observacoes_medicas} subtitleLines={6} /></ListSection>
          <SectionFooter>Visível só para a família e o motorista.</SectionFooter>
        </>
      ) : null}

      {role !== 'INSTITUICAO' && (
        <>
          <SectionHeader title="Pessoas autorizadas" action={pai ? { label: 'Adicionar', onPress: () => setAddPessoa(true) } : undefined} />
          {pessoas.length === 0 ? (
            <Card><Text style={s.muted}>Ninguém além dos responsáveis foi autorizado a buscar o aluno.</Text></Card>
          ) : (
            <ListSection>
              {pessoas.map((p) => (
                <ListRow key={p.id} leading={<Avatar name={p.nome} />} title={p.nome}
                  subtitle={`${p.grau_parentesco} · ${SecurityService.maskPhone(p.telefone)}`}
                  trailing={pai ? <IconButton icon="trash" label={`Remover ${p.nome}`} variant="plain" tint={colors.error} onPress={() => remover(p.id, p.nome)} /> : undefined} />
              ))}
            </ListSection>
          )}
          <SectionFooter>Só estas pessoas podem receber o aluno no ponto. O motorista confere o documento.</SectionFooter>
        </>
      )}

      {contrato && (
        <>
          <SectionHeader title="Contrato" />
          <ListSection>
            <ListRow icon="doc" iconTone="gray" title={`Contrato ${contrato.numero_contrato}`} subtitle={`${brl(contrato.valor_mensalidade)} por mês`} onPress={() => go.contract(a.id)} />
          </ListSection>
        </>
      )}

      <AbsenceSheet visible={absence} onClose={() => setAbsence(false)} alunoId={a.id} />
      <AuthorizedSheet visible={addPessoa} onClose={() => setAddPessoa(false)} alunoId={a.id} />
    </Screen>
  );
};

/* --------------------------------------------------------- Contrato */
export const ContractScreen: React.FC<{ alunoId?: string }> = ({ alunoId }) => {
  const { contratos, alunos, nomes } = useApp();
  const c = contratos.find((x) => x.aluno_id === alunoId);
  const aluno = alunos.find((x) => x.id === alunoId);
  if (!c) return <Screen title="Contrato"><EmptyState icon="doc" title="Sem contrato" message="O contrato é criado quando o aluno é vinculado ao motorista." /></Screen>;
  return (
    <Screen title="Contrato" subtitle={c.numero_contrato}>
      <ListSection>
        <ListRow icon="person" iconTone="gray" title="Aluno" value={aluno?.nome ?? '-'} />
        <ListRow icon="van" iconTone="signal" title="Transportador" value={nomes.transportador ?? '-'} />
        <ListRow icon="cash" iconTone="gray" title="Mensalidade" value={brl(c.valor_mensalidade)} />
        <ListRow icon="calendar" iconTone="gray" title="Vencimento" value={`Dia ${c.dia_vencimento}`} />
        <ListRow icon="clock" iconTone="gray" title="Vigência" value={`${isoToBR(c.data_inicio)} a ${isoToBR(c.data_termino)}`} />
        <ListRow icon="shield" iconTone="success" title="Situação" value={c.status === 'ATIVO' ? 'Ativo' : c.status} />
      </ListSection>
      {c.termos_condicoes ? (
        <>
          <SectionHeader title="Termos" />
          <Card><Text style={s.terms} selectable>{c.termos_condicoes}</Text></Card>
        </>
      ) : null}
    </Screen>
  );
};

/* --------------------------------------------------------- Mensalidade / recibo */
export const PaymentDetailScreen: React.FC<{ id?: string }> = ({ id }) => {
  const { mensalidades, pagamentos, role, confirmarRecebimento, alunos, contratos } = useApp();
  const [pay, setPay] = useState(false);
  const [busy, setBusy] = useState(false);
  const m = mensalidades.find((x) => x.id === id);
  if (!m) return <Screen title="Mensalidade"><EmptyState icon="alert" title="Não encontrada" message="Volte e tente novamente." /></Screen>;
  const pend = pagamentos.find((p) => p.mensalidade_id === m.id && p.status === 'PENDENTE');
  const conf = pagamentos.find((p) => p.mensalidade_id === m.id && p.status === 'CONFIRMADO');
  const contrato = contratos.find((c) => c.id === m.contrato_id);
  const aluno = alunos.find((a) => a.id === contrato?.aluno_id);
  const total = m.valor + (m.valor_multa_juros ?? 0);
  const pago = m.status === 'PAGO';
  const atrasado = m.status === 'VENCIDO';

  const confirmar = async (aceitar: boolean) => {
    setBusy(true);
    try { await confirmarRecebimento(pend!.id, aceitar); } catch (e) { notify('Erro', (e as Error).message); } finally { setBusy(false); }
  };
  const recibo = pago ? SecurityService.generateReceiptHash(m.id, m.valor, m.criado_em) : null;
  const titulo = `${nomeMes(m.mes_referencia)} ${m.ano_referencia}`;

  return (
    <Screen title={titulo}
      headerRight={recibo ? <IconButton icon="share" label="Compartilhar recibo" variant="plain"
        onPress={() => share({ title: `Recibo · ${titulo}`, message: `Recibo VanEscolar GPS\n${aluno?.nome ?? ''} · ${titulo}\n${brl(m.valor)}\nAutenticação: ${recibo}` })} /> : undefined}
      footer={role === 'RESPONSAVEL' && !pago && !pend ? <Button variant="filled" label={`Pagar ${brl(total)}`} onPress={() => setPay(true)} /> :
        role === 'TRANSPORTADOR' && pend ? (
          <View style={{ flexDirection: 'row', gap: gap.related }}>
            <Button style={{ flex: 1 }} variant="bordered" label="Não recebi" onPress={() => confirmar(false)} disabled={busy} />
            <Button style={{ flex: 1 }} label="Confirmar" onPress={() => confirmar(true)} loading={busy} />
          </View>) : undefined}>
      <View style={s.amountBlock}>
        {aluno ? <Text style={s.center}>Mensalidade · {aluno.nome}</Text> : null}
        <Text style={s.amount} accessibilityLabel={`Valor ${brl(total)}`}>{brl(total)}</Text>
        <StatusPill
          tone={pago ? 'success' : atrasado ? 'error' : pend ? 'info' : 'neutral'}
          label={pago ? 'Pago' : pend ? 'Aguardando confirmação' : atrasado ? 'Em atraso' : `Vence ${isoToBR(m.data_vencimento)}`}
        />
      </View>
      <ListSection>
        <ListRow title="Mensalidade" value={brl(m.valor)} />
        {m.valor_multa_juros > 0 ? <ListRow title="Multa e juros" value={brl(m.valor_multa_juros)} /> : null}
        <ListRow title="Vencimento" value={isoToBR(m.data_vencimento)} />
        {conf ? <ListRow title="Forma de pagamento" value={conf.metodo === 'CARTAO' ? 'Cartão' : conf.metodo === 'BOLETO' ? 'Boleto/outro' : 'PIX'} /> : null}
        {conf ? <ListRow title="Pago em" value={new Date(conf.data_pagamento).toLocaleDateString('pt-BR')} /> : null}
      </ListSection>
      {recibo ? (
        <>
          <SectionHeader title="Recibo digital" />
          <Card><Text selectable style={s.hash}>{recibo}</Text></Card>
          <SectionFooter>Código de autenticação do recibo.</SectionFooter>
        </>
      ) : !pago ? <SectionFooter>O recibo digital fica disponível aqui assim que o motorista confirmar o recebimento.</SectionFooter> : null}
      {contrato && (
        <>
          <SectionHeader title="Contrato" />
          <ListSection><ListRow icon="doc" iconTone="gray" title="Ver contrato" onPress={() => go.contract(contrato.aluno_id)} /></ListSection>
        </>
      )}
      <PaySheet visible={pay} onClose={() => setPay(false)} mensalidade={m} />
    </Screen>
  );
};

const s = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  heroName: { ...type.title2, color: colors.label, textAlign: 'center', marginTop: spacing.xs },
  center: { ...type.footnote, color: colors.secondaryLabel, textAlign: 'center' },
  muted: { ...type.subheadline, color: colors.secondaryLabel },
  terms: { ...type.subheadline, color: colors.secondaryLabel },
  amountBlock: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg, marginBottom: spacing.sm },
  amount: { ...type.amount, color: colors.label },
  hash: { ...type.footnote, color: colors.secondaryLabel, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
});
