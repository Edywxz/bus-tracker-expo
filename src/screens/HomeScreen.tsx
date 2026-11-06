import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { gap, spacing } from '../theme/tokens';
import { type } from '../theme/type';
import { FadeInUp } from '../components/ui/FadeInUp';
import {
  Avatar, Button, Card, EmptyState, ListRow, ListSection, Notice, ProgressBar, Screen, SectionHeader, Stat, StatusPill, statusAluno,
} from '../components/ui/kit';
import { RouteMap } from '../components/RouteMap';
import { useApp } from '../context/AppContext';
import { go } from '../navigation/routes';
import { AbsenceSheet, AddStudentSheet, EmergencySheet, StartRouteSheet } from '../sheets/Sheets';

export const HomeScreen: React.FC = () => {
  const {
    role, perfil, alunos, viagemAtiva, temViagem, temVeiculo, gpsPosicao, gpsAtivo, gpsStep, isDemo,
    simularPassoGps, finalizarViagem, codigoConvite, recarregar, nomes,
  } = useApp();
  const [absence, setAbsence] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [start, setStart] = useState(false);
  const [addStudent, setAddStudent] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const emRota = viagemAtiva.status === 'EM_ANDAMENTO';
  const aBordo = alunos.filter((a) => a.statusEmbarque === 'EMBARCADO').length;
  const naEscola = alunos.filter((a) => a.statusEmbarque === 'DESEMBARCADO').length;
  const ativos = alunos.filter((a) => a.statusEmbarque !== 'AUSENTE').length;
  const primeiro = (perfil?.nome ?? (role === 'TRANSPORTADOR' ? 'Marcos' : 'Carlos')).split(' ')[0];
  const motorista = role === 'TRANSPORTADOR';
  const pai = role === 'RESPONSAVEL';

  const title = motorista ? 'Rota de hoje' : role === 'INSTITUICAO' ? 'Chegadas' : `Olá, ${primeiro}`;
  const subtitle = emRota
    ? pai ? 'A van está a caminho' : 'Rota em andamento'
    : alunos.length ? 'Nenhuma rota em andamento agora' : undefined;

  const concluir = async () => {
    setFinishing(true); setErro(null);
    try { await finalizarViagem(); } catch (e) { setErro((e as Error).message); } finally { setFinishing(false); }
  };

  /* ---- estados vazios por perfil ---- */
  const vazio = (() => {
    if (alunos.length > 0) return null;
    if (pai)
      return <EmptyState icon="personAdd" title="Vamos começar" message="Cadastre seu filho com o código que o motorista passou. Em segundos você já acompanha a van."
        action={<Button size="lg" label="Adicionar aluno" onPress={() => setAddStudent(true)} />} />;
    return (
      <Card style={{ alignItems: 'center', gap: spacing.s6 }}>
        <Text style={s.caption}>Seu código de convite</Text>
        <Text style={s.code} selectable accessibilityLabel={`Código ${(codigoConvite ?? '').split('').join(' ')}`}>{codigoConvite ?? '——'}</Text>
        <Text style={s.mutedCenter}>
          {motorista
            ? 'Passe este código aos pais. Quando cadastrarem o aluno, ele aparece aqui na sua rota.'
            : 'Passe este código aos pais para vincular a escola aos alunos e acompanhar as chegadas.'}
        </Text>
      </Card>
    );
  })();

  return (
    <Screen title={title} subtitle={subtitle} onRefresh={recarregar}>
      {motorista && !temVeiculo && !isDemo && (
        <FadeInUp index={0} style={s.block}>
          <Notice tone="warning" message="Cadastre seu veículo para poder iniciar rotas." />
          <View style={{ height: gap.related }} />
          <Button variant="bordered" label="Cadastrar veículo" icon="vanOutline" onPress={go.vehicle} />
        </FadeInUp>
      )}

      {vazio ? <FadeInUp index={1}>{vazio}</FadeInUp> : (
        <>
          {/* Aviso principal (pais, rota ao vivo) — único card amarelo da tela */}
          {pai && emRota && (
            <FadeInUp index={0} style={s.block}>
              <Card variant="signal">
                <StatusPill tone="signal" label="A caminho" live />
                <Text style={s.signalTitle}>{nomes.transportador ?? 'A van'} está na rota</Text>
                <Text style={s.signalText}>Leve seu filho até o portão. Avisamos de novo quando a van estiver chegando.</Text>
              </Card>
            </FadeInUp>
          )}

          {/* Mapa + telemetria */}
          <FadeInUp index={0} style={s.block}>
            <Card padded={false} style={{ padding: spacing.sm }}>
              <View style={s.mapHead}>
                <StatusPill
                  tone={emRota ? 'signal' : temViagem && viagemAtiva.status === 'CONCLUIDA' ? 'success' : 'neutral'}
                  label={emRota ? 'Em trânsito' : temViagem && viagemAtiva.status === 'CONCLUIDA' ? 'Rota concluída' : 'Parada'}
                  live={emRota}
                />
                <Text style={s.trip}>{viagemAtiva.tipo_viagem === 'IDA' ? 'Ida à escola' : 'Volta para casa'}</Text>
              </View>
              <RouteMap
                step={gpsStep}
                ativo={emRota && gpsAtivo}
                endereco={emRota ? gpsPosicao.rua : 'Van estacionada'}
                velocidade={gpsPosicao.velocidade}
                pins={alunos.map((a) => ({ nome: a.nome, status: a.statusEmbarque }))}
              />
              <View style={s.stats}>
                <Stat label="A bordo" value={`${aBordo}`} />
                <Stat label="Na escola" value={`${naEscola}`} />
                <Stat label="Previstos" value={`${ativos}`} />
              </View>
              {emRota && ativos > 0 && (
                <View style={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.sm }}>
                  <ProgressBar value={aBordo + naEscola} total={ativos} tone="signal" accessibilityLabel="Progresso da rota" />
                </View>
              )}
            </Card>
          </FadeInUp>

          {/* Ações por perfil */}
          <FadeInUp index={1} style={s.block}>
            {motorista && (
              <View style={{ gap: gap.related }}>
                {emRota ? (
                  <View style={s.row}>
                    <Button style={{ flex: 1 }} variant="bordered" label="Concluir rota" icon="flag" onPress={concluir} loading={finishing} />
                    <Button style={{ flex: 1 }} variant="tinted" role="destructive" label="Ocorrência" icon="warning" onPress={() => setEmergency(true)} />
                  </View>
                ) : (
                  <Button size="lg" label="Iniciar rota" icon="play" onPress={() => setStart(true)} disabled={!temVeiculo && !isDemo} />
                )}
                {isDemo && emRota && (
                  <Button variant="gray" label="Avançar GPS (simulação)" icon="forward" onPress={simularPassoGps} />
                )}
              </View>
            )}
            {pai && (
              <View style={s.row}>
                <Button style={{ flex: 1 }} variant="tinted" label="Avisar falta" icon="calendar" onPress={() => setAbsence(true)} />
                {isDemo && emRota && (
                  <Button style={{ flex: 1 }} variant="gray" label="Avançar van" icon="forward" onPress={simularPassoGps} />
                )}
              </View>
            )}
            {erro && <View style={{ marginTop: gap.related }}><Notice tone="error" message={erro} /></View>}
            {pai && !emRota && nomes.transportador && (
              <Text style={[s.mutedCenter, { marginTop: spacing.md }]}>{nomes.transportador} ainda não iniciou a rota de hoje.</Text>
            )}
          </FadeInUp>

          {/* Paradas */}
          <FadeInUp index={2}>
            <SectionHeader title={role === 'INSTITUICAO' ? 'Alunos desta escola' : 'Paradas'} />
            <ListSection>
              {alunos.map((a) => {
                const st = statusAluno(a.statusEmbarque);
                return (
                  <ListRow
                    key={a.id}
                    leading={<Avatar name={a.nome} onBoard={a.statusEmbarque === 'EMBARCADO'} />}
                    title={a.nome}
                    subtitle={a.ultimoRegistro ?? a.endereco_busca}
                    trailing={<StatusPill tone={st.tone} label={st.label} />}
                    onPress={role === 'INSTITUICAO' ? undefined : () => go.student(a.id)}
                    chevron={false}
                  />
                );
              })}
            </ListSection>
          </FadeInUp>
        </>
      )}

      <AbsenceSheet visible={absence} onClose={() => setAbsence(false)} />
      <EmergencySheet visible={emergency} onClose={() => setEmergency(false)} />
      <StartRouteSheet visible={start} onClose={() => setStart(false)} />
      <AddStudentSheet visible={addStudent} onClose={() => setAddStudent(false)} />
    </Screen>
  );
};

const s = StyleSheet.create({
  block: { marginBottom: gap.section - spacing.sm },
  row: { flexDirection: 'row', gap: gap.related },
  mapHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm, paddingTop: spacing.xs, paddingBottom: spacing.sm + 2 },
  trip: { ...type.footnote, fontWeight: '600', color: colors.secondaryLabel },
  stats: { flexDirection: 'row', paddingHorizontal: spacing.sm, paddingVertical: spacing.md + 2 },
  caption: { ...type.sectionHeader, color: colors.secondaryLabel },
  code: { fontSize: 38, fontWeight: '800', letterSpacing: 6, color: colors.label, fontVariant: ['tabular-nums'] },
  mutedCenter: { ...type.subheadline, color: colors.secondaryLabel, textAlign: 'center' },
  signalTitle: { ...type.headline, color: colors.onSignalContainer, marginTop: spacing.md },
  signalText: { ...type.subheadline, color: colors.onSignalContainer, marginTop: spacing.xs },
});
