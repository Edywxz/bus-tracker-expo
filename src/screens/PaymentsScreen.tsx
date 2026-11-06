import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { gap, spacing } from '../theme/tokens';
import { type } from '../theme/type';
import { FadeInUp } from '../components/ui/FadeInUp';
import {
  Button, Card, EmptyState, ListRow, ListSection, Screen, SectionHeader, SegmentedControl, Stat, StatusPill,
} from '../components/ui/kit';
import { useApp } from '../context/AppContext';
import { go } from '../navigation/routes';
import { brl, isoToBR, nomeMes } from '../utils/format';
import { Mensalidade } from '../types/database';

type Filtro = 'ABERTAS' | 'PAGAS' | 'TODAS';

export const PaymentsScreen: React.FC = () => {
  const { mensalidades, pagamentos, contratos, alunos, role, recarregar } = useApp();
  const [filtro, setFiltro] = useState<Filtro>('ABERTAS');
  const motorista = role === 'TRANSPORTADOR';

  const pendente = (m: Mensalidade) => pagamentos.some((p) => p.mensalidade_id === m.id && p.status === 'PENDENTE');
  const nomeAluno = (m: Mensalidade) => {
    const c = contratos.find((x) => x.id === m.contrato_id);
    return alunos.find((a) => a.id === c?.aluno_id)?.nome ?? '';
  };
  const hoje = new Date().toISOString().slice(0, 10);
  const efetivo = (m: Mensalidade) => (m.status === 'PENDENTE' && m.data_vencimento < hoje ? 'VENCIDO' : m.status);

  const abertas = mensalidades.filter((m) => m.status !== 'PAGO' && m.status !== 'CANCELADO');
  const proxima = abertas[0];
  const lista = useMemo(() => mensalidades.filter((m) => filtro === 'TODAS' ? true : filtro === 'PAGAS' ? m.status === 'PAGO' : m.status !== 'PAGO' && m.status !== 'CANCELADO'), [mensalidades, filtro]);
  const aguardando = mensalidades.filter(pendente);
  const aReceber = abertas.reduce((t, m) => t + m.valor + (m.valor_multa_juros ?? 0), 0);
  const recebido = mensalidades.filter((m) => m.status === 'PAGO').reduce((t, m) => t + m.valor, 0);

  const pill = (m: Mensalidade) => {
    if (m.status === 'PAGO') return <StatusPill tone="success" label="Pago" />;
    if (pendente(m)) return <StatusPill tone="info" label="Em análise" />;
    if (efetivo(m) === 'VENCIDO') return <StatusPill tone="error" label="Atrasada" />;
    return <StatusPill tone="neutral" label="Aberta" />;
  };

  return (
    <Screen title={motorista ? 'Receber' : 'Pagamentos'} subtitle={motorista ? 'Mensalidades dos seus alunos' : undefined} onRefresh={recarregar}>
      {mensalidades.length === 0 ? (
        <EmptyState icon="wallet" title="Sem mensalidades" message={motorista
          ? 'As mensalidades são geradas quando os pais cadastram o aluno com o seu código.'
          : 'As mensalidades são criadas assim que você cadastra o aluno e vincula ao motorista.'} />
      ) : (
        <>
          <FadeInUp index={0} style={{ marginBottom: spacing.sm }}>
            {motorista ? (
              <Card>
                <View style={{ flexDirection: 'row' }}>
                  <Stat label="A receber" value={brl(aReceber)} />
                  <Stat label="Recebido" value={brl(recebido)} tone="success" />
                </View>
              </Card>
            ) : proxima ? (
              <Card style={{ gap: spacing.sm }}>
                <Text style={s.cap}>Próxima mensalidade</Text>
                <Text style={s.amount}>{brl(proxima.valor + (proxima.valor_multa_juros ?? 0))}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
                  {pill(proxima)}
                  <Text style={s.muted}>{nomeMes(proxima.mes_referencia)} · vence {isoToBR(proxima.data_vencimento)}</Text>
                </View>
                {!pendente(proxima) && <View style={{ marginTop: spacing.sm }}><Button variant="filled" label="Pagar agora" onPress={() => go.payment(proxima.id)} /></View>}
                {pendente(proxima) && <Text style={[s.muted, { marginTop: spacing.xs }]}>Pagamento informado. Aguardando o motorista confirmar.</Text>}
              </Card>
            ) : (
              <Card style={{ alignItems: 'center', gap: spacing.s6 }}>
                <Text style={s.title}>Tudo em dia</Text>
                <Text style={s.muted}>Nenhuma mensalidade em aberto.</Text>
              </Card>
            )}
          </FadeInUp>

          {motorista && aguardando.length > 0 && (
            <FadeInUp index={1}>
              <SectionHeader title="Confirme o recebimento" />
              <ListSection>
                {aguardando.map((m) => (
                  <ListRow key={m.id} icon="hourglass" iconTone="info"
                    title={nomeAluno(m) || `${nomeMes(m.mes_referencia)}`} subtitle={`${nomeMes(m.mes_referencia)} · ${brl(m.valor)}`}
                    onPress={() => go.payment(m.id)} />
                ))}
              </ListSection>
            </FadeInUp>
          )}

          <FadeInUp index={2}>
            <SectionHeader title="Mensalidades" />
            <View style={{ marginBottom: gap.related + spacing.xs }}>
              <SegmentedControl<Filtro> value={filtro} onChange={setFiltro} accessibilityLabel="Filtrar mensalidades"
                options={[{ value: 'ABERTAS', label: 'Em aberto' }, { value: 'PAGAS', label: 'Pagas' }, { value: 'TODAS', label: 'Todas' }]} />
            </View>
            {lista.length === 0 ? (
              <EmptyState icon="checkDone" title="Nada aqui" message="Nenhuma mensalidade neste filtro." />
            ) : (
              <ListSection>
                {lista.map((m) => (
                  <ListRow key={m.id} title={`${nomeMes(m.mes_referencia)} ${m.ano_referencia}`}
                    subtitle={`${motorista && nomeAluno(m) ? nomeAluno(m) + ' · ' : ''}${brl(m.valor)} · vence ${isoToBR(m.data_vencimento)}`}
                    trailing={pill(m)} chevron onPress={() => go.payment(m.id)} />
                ))}
              </ListSection>
            )}
          </FadeInUp>
        </>
      )}
    </Screen>
  );
};

const s = StyleSheet.create({
  cap: { ...type.sectionHeader, color: colors.secondaryLabel },
  amount: { ...type.amount, color: colors.label },
  title: { ...type.title2, color: colors.label },
  muted: { ...type.footnote, color: colors.secondaryLabel },
});
