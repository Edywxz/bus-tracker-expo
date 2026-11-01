import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/tokens';
import { type } from '../theme/type';
import { LargeTitleScreen } from '../components/ui/LargeTitleScreen';
import { FadeInUp } from '../components/ui/FadeInUp';
import { AppleButton } from '../components/AppleButton';
import { Avatar, Badge, Banner, Card, EmptyState, Group, ProgressBar, Row, SectionLabel, Stat, statusAluno } from '../components/ui/kit';
import { RouteMap } from '../components/RouteMap';
import { useApp } from '../context/AppContext';
import { useStack } from '../navigation/Stack';
import { AbsenceSheet, AddStudentSheet, EmergencySheet, StartRouteSheet } from '../sheets/Sheets';

export const HomeScreen: React.FC = () => {
  const {
    role, perfil, alunos, viagemAtiva, temViagem, temVeiculo, gpsPosicao, gpsAtivo, gpsStep, isDemo,
    simularPassoGps, finalizarViagem, codigoConvite, recarregar, nomes,
  } = useApp();
  const stack = useStack();
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

  const title = role === 'TRANSPORTADOR' ? 'Rota de hoje' : role === 'INSTITUICAO' ? 'Chegadas' : `Olá, ${primeiro}`;
  const subtitle = emRota
    ? role === 'RESPONSAVEL' ? 'A van está a caminho' : 'Rota em andamento'
    : alunos.length ? 'Nenhuma rota em andamento agora' : undefined;

  const concluir = async () => {
    setFinishing(true); setErro(null);
    try { await finalizarViagem(); } catch (e) { setErro((e as Error).message); } finally { setFinishing(false); }
  };

  /* ---- estados vazios por perfil ---- */
  const vazio = (() => {
    if (alunos.length > 0) return null;
    if (role === 'RESPONSAVEL')
      return <EmptyState icon="person-add" title="Vamos começar" message="Cadastre seu filho com o código que o motorista passou. Em segundos você já acompanha a van."
        action={<AppleButton size="lg" title="Adicionar aluno" onPress={() => setAddStudent(true)} />} />;
    return (
      <Card style={{ alignItems: 'center', gap: 8 }}>
        <Text style={s.caption}>SEU CÓDIGO DE CONVITE</Text>
        <Text style={s.code} selectable accessibilityLabel={`Código ${codigoConvite ?? ''}`}>{codigoConvite ?? '——'}</Text>
        <Text style={s.mutedCenter}>
          {role === 'TRANSPORTADOR'
            ? 'Passe este código aos pais. Quando cadastrarem o aluno, ele aparece aqui na sua rota.'
            : 'Passe este código aos pais para vincular a escola aos alunos e acompanhar as chegadas.'}
        </Text>
      </Card>
    );
  })();

  return (
    <LargeTitleScreen title={title} subtitle={subtitle} onRefresh={recarregar}>
      {role === 'TRANSPORTADOR' && !temVeiculo && !isDemo && (
        <FadeInUp index={0} style={s.block}>
          <Banner tone="warning" message="Cadastre seu veículo para poder iniciar rotas." />
          <View style={{ height: 10 }} />
          <AppleButton variant="secondary" title="Cadastrar veículo" onPress={() => stack.push('Vehicle')}
            icon={<Ionicons name="bus-outline" size={16} color={colors.textPrimary} />} />
        </FadeInUp>
      )}

      {vazio ? <FadeInUp index={1}>{vazio}</FadeInUp> : (
        <>
          {/* Mapa + telemetria */}
          <FadeInUp index={0} style={s.block}>
            <Card padded={false} style={{ padding: 10 }}>
              <View style={s.mapHead}>
                <Badge
                  label={emRota ? 'Em trânsito' : temViagem && viagemAtiva.status === 'CONCLUIDA' ? 'Rota concluída' : 'Parada'}
                  color={emRota ? colors.systemGreenText : colors.textSecondary}
                  bg={emRota ? colors.systemGreenLight : colors.background}
                  icon={emRota ? 'radio-button-on' : 'pause-circle'}
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
              {emRota && ativos > 0 && <View style={{ paddingHorizontal: 8, paddingBottom: 6 }}><ProgressBar value={aBordo + naEscola} total={ativos} color={colors.systemGreen} /></View>}
            </Card>
          </FadeInUp>

          {/* Ações por perfil */}
          <FadeInUp index={1} style={s.block}>
            {role === 'TRANSPORTADOR' && (
              <View style={{ gap: 10 }}>
                {emRota ? (
                  <View style={s.row}>
                    <AppleButton style={{ flex: 1 }} variant="secondary" title="Concluir rota" onPress={concluir} loading={finishing}
                      icon={<Ionicons name="flag-outline" size={16} color={colors.textPrimary} />} />
                    <AppleButton style={{ flex: 1 }} variant="destructive" title="Ocorrência" onPress={() => setEmergency(true)}
                      icon={<Ionicons name="warning-outline" size={16} color={colors.systemRed} />} />
                  </View>
                ) : (
                  <AppleButton size="lg" title="Iniciar rota" onPress={() => setStart(true)}
                    icon={<Ionicons name="play" size={16} color="#fff" />} disabled={!temVeiculo && !isDemo} />
                )}
                {isDemo && emRota && (
                  <AppleButton variant="tonal" title="Avançar GPS (simulação)" onPress={simularPassoGps}
                    icon={<Ionicons name="arrow-forward-circle-outline" size={16} color={colors.accentText} />} />
                )}
              </View>
            )}
            {role === 'RESPONSAVEL' && (
              <View style={s.row}>
                <AppleButton style={{ flex: 1 }} variant="tonal" title="Avisar falta" onPress={() => setAbsence(true)}
                  icon={<Ionicons name="calendar-outline" size={16} color={colors.accentText} />} />
                {isDemo && emRota && (
                  <AppleButton style={{ flex: 1 }} variant="secondary" title="Avançar van" onPress={simularPassoGps}
                    icon={<Ionicons name="arrow-forward-circle-outline" size={16} color={colors.textPrimary} />} />
                )}
              </View>
            )}
            {erro && <View style={{ marginTop: 10 }}><Banner tone="error" message={erro} /></View>}
            {role === 'RESPONSAVEL' && !emRota && nomes.transportador && (
              <Text style={[s.mutedCenter, { marginTop: 12 }]}>{nomes.transportador} ainda não iniciou a rota de hoje.</Text>
            )}
          </FadeInUp>

          {/* Lista de alunos */}
          <FadeInUp index={2}>
            <SectionLabel>{role === 'INSTITUICAO' ? 'Alunos desta escola' : 'Paradas'}</SectionLabel>
            <Group>
              {alunos.map((a) => {
                const st = statusAluno(a.statusEmbarque);
                return (
                  <Row
                    key={a.id}
                    left={<Avatar name={a.nome} />}
                    title={a.nome}
                    subtitle={a.ultimoRegistro ?? a.endereco_busca}
                    right={<Badge label={st.label} color={st.color} bg={st.bg} icon={st.icon} />}
                    onPress={role === 'INSTITUICAO' ? undefined : () => stack.push('StudentDetail', { id: a.id })}
                    chevron={false}
                  />
                );
              })}
            </Group>
          </FadeInUp>
        </>
      )}

      <AbsenceSheet visible={absence} onClose={() => setAbsence(false)} />
      <EmergencySheet visible={emergency} onClose={() => setEmergency(false)} />
      <StartRouteSheet visible={start} onClose={() => setStart(false)} />
      <AddStudentSheet visible={addStudent} onClose={() => setAddStudent(false)} />
    </LargeTitleScreen>
  );
};

const s = StyleSheet.create({
  block: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: 10 },
  mapHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 8 },
  trip: { ...type.footnote, fontWeight: '600', color: colors.textTertiary },
  stats: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 14 },
  caption: { ...type.caption, color: colors.textTertiary, letterSpacing: 1 },
  code: { fontSize: 38, fontWeight: '800', letterSpacing: 6, color: colors.textPrimary },
  mutedCenter: { ...type.subhead, color: colors.textTertiary, textAlign: 'center' },
});
