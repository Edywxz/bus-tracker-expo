import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { type } from '../theme/type';
import { LargeTitleScreen } from '../components/ui/LargeTitleScreen';
import { FadeInUp } from '../components/ui/FadeInUp';
import { AppleButton } from '../components/AppleButton';
import { Badge, Card, EmptyState, Group, Row, SectionLabel, Segmented, Stat } from '../components/ui/kit';
import { useApp } from '../context/AppContext';
import { useStack } from '../navigation/Stack';
import { PaySheet } from '../sheets/Sheets';
import { brl, isoToBR, nomeMes } from '../utils/format';
import { Mensalidade } from '../types/database';

type Filtro = 'ABERTAS' | 'PAGAS' | 'TODAS';

export const PaymentsScreen: React.FC = () => {
  const { mensalidades, pagamentos, contratos, alunos, role, recarregar } = useApp();
  const stack = useStack();
  const [filtro, setFiltro] = useState<Filtro>('ABERTAS');
  const [pay, setPay] = useState<Mensalidade | null>(null);
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

  const badge = (m: Mensalidade) => {
    if (m.status === 'PAGO') return <Badge label="Pago" color={colors.systemGreenText} bg={colors.systemGreenLight} />;
    if (pendente(m)) return <Badge label="Em análise" color={colors.systemBlueText} bg={colors.systemBlueLight} />;
    if (efetivo(m) === 'VENCIDO') return <Badge label="Atrasada" color={colors.systemRedText} bg={colors.systemRedLight} />;
    return <Badge label="Aberta" color={colors.accentText} bg={colors.accentLight} />;
  };

  return (
    <LargeTitleScreen title="Financeiro" subtitle={motorista ? 'Mensalidades dos seus alunos' : undefined} onRefresh={recarregar}>
      {mensalidades.length === 0 ? (
        <EmptyState icon="wallet" title="Sem mensalidades" message={motorista
          ? 'As mensalidades são geradas quando os pais cadastram o aluno com o seu código.'
          : 'As mensalidades são criadas assim que você cadastra o aluno e vincula ao motorista.'} />
      ) : (
        <>
          <FadeInUp index={0} style={{ marginBottom: 16 }}>
            {motorista ? (
              <Card>
                <View style={{ flexDirection: 'row' }}>
                  <Stat label="A receber" value={brl(aReceber)} tone={colors.accentDark} />
                  <Stat label="Recebido" value={brl(recebido)} tone={colors.systemGreenText} />
                </View>
              </Card>
            ) : proxima ? (
              <Card style={{ gap: 6 }}>
                <Text style={s.cap}>PRÓXIMA MENSALIDADE</Text>
                <Text style={s.amount}>{brl(proxima.valor + (proxima.valor_multa_juros ?? 0))}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {badge(proxima)}
                  <Text style={s.muted}>{nomeMes(proxima.mes_referencia)} · vence {isoToBR(proxima.data_vencimento)}</Text>
                </View>
                {!pendente(proxima) && <View style={{ marginTop: 10 }}><AppleButton size="lg" title="Pagar agora" onPress={() => setPay(proxima)} /></View>}
                {pendente(proxima) && <Text style={[s.muted, { marginTop: 8 }]}>Pagamento informado. Aguardando o motorista confirmar.</Text>}
              </Card>
            ) : (
              <Card style={{ alignItems: 'center', gap: 6 }}>
                <Text style={s.amount}>Tudo em dia</Text>
                <Text style={s.muted}>Nenhuma mensalidade em aberto.</Text>
              </Card>
            )}
          </FadeInUp>

          {motorista && aguardando.length > 0 && (
            <FadeInUp index={1} style={{ marginBottom: 16 }}>
              <SectionLabel>Confirme o recebimento</SectionLabel>
              <Group>
                {aguardando.map((m) => (
                  <Row key={m.id} icon="hourglass-outline" iconColor={colors.systemBlueText} iconBg={colors.systemBlueLight}
                    title={nomeAluno(m) || `${nomeMes(m.mes_referencia)}`} subtitle={`${nomeMes(m.mes_referencia)} · ${brl(m.valor)}`}
                    onPress={() => stack.push('PaymentDetail', { id: m.id })} />
                ))}
              </Group>
            </FadeInUp>
          )}

          <FadeInUp index={2}>
            <View style={{ marginBottom: 12 }}>
              <Segmented<Filtro> value={filtro} onChange={setFiltro}
                options={[{ value: 'ABERTAS', label: 'Em aberto' }, { value: 'PAGAS', label: 'Pagas' }, { value: 'TODAS', label: 'Todas' }]} />
            </View>
            {lista.length === 0 ? (
              <EmptyState icon="checkmark-done" title="Nada aqui" message="Nenhuma mensalidade neste filtro." />
            ) : (
              <Group>
                {lista.map((m) => (
                  <Row key={m.id} title={`${nomeMes(m.mes_referencia)} ${m.ano_referencia}`}
                    subtitle={`${motorista && nomeAluno(m) ? nomeAluno(m) + ' · ' : ''}${brl(m.valor)} · vence ${isoToBR(m.data_vencimento)}`}
                    right={badge(m)} onPress={() => stack.push('PaymentDetail', { id: m.id })} chevron />
                ))}
              </Group>
            )}
          </FadeInUp>
        </>
      )}
      <PaySheet visible={!!pay} mensalidade={pay} onClose={() => setPay(null)} />
    </LargeTitleScreen>
  );
};

const s = StyleSheet.create({
  cap: { ...type.caption, color: colors.textTertiary, letterSpacing: 1 },
  amount: { fontSize: 38, fontWeight: '800', letterSpacing: -1.2, color: colors.textPrimary },
  muted: { ...type.footnote, color: colors.textTertiary },
});
