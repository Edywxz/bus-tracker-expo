import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { gap, layout, radius, spacing } from '../theme/tokens';
import { type } from '../theme/type';
import {
  Avatar, Button, GlassSurface, IconButton, Notice, ProgressBar, PullDownButton, StatusPill, statusAluno,
} from '../components/ui/kit';
import { RouteMap } from '../components/RouteMap';
import { LiveMap, type MapaParada } from '../components/LiveMap';
import { useApp } from '../context/AppContext';
import { go } from '../navigation/routes';
import { pontoDeDescida, primeiroAChegar } from '../utils/proximidade';
import { AbsenceSheet, AddStudentSheet, EmergencySheet, StartRouteSheet } from '../sheets/Sheets';

const TURNO: Record<string, string> = { MANHA: 'manhã', TARDE: 'tarde', INTEGRAL: 'integral', NOITE: 'noite' };

/** Hora prevista "~6h52" a partir de minutos à frente. */
const horaPrevista = (min: number) => {
  const d = new Date(Date.now() + min * 60000);
  return `~${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
};
const km = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: v < 10 ? 1 : 0 })} km`;

/**
 * Rota — primeira tela (concept "First view").
 * Mapa em tela cheia · botões de vidro no topo · sheet de vidro flutuante com status, tempo, progresso,
 * o aluno e as duas ações. O conteúdo da sheet muda por perfil (pais ou motorista).
 */
export const HomeScreen: React.FC = () => {
  const {
    role, alunos, viagemAtiva, temViagem, temVeiculo, gpsPosicao, gpsAtivo, gpsStep, isDemo, estimativaRota, rotaGeo,
    simularPassoGps, finalizarViagem, codigoConvite, recarregar, nomes,
  } = useApp();
  const [absence, setAbsence] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [start, setStart] = useState(false);
  const [addStudent, setAddStudent] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const emRota = viagemAtiva.status === 'EM_ANDAMENTO';
  const concluida = temViagem && viagemAtiva.status === 'CONCLUIDA';
  const motorista = role === 'TRANSPORTADOR';
  const pai = role === 'RESPONSAVEL';
  const aBordo = alunos.filter((a) => a.statusEmbarque === 'EMBARCADO').length;
  const naEscola = alunos.filter((a) => a.statusEmbarque === 'DESEMBARCADO').length;
  const ativos = alunos.filter((a) => a.statusEmbarque !== 'AUSENTE').length;
  const aguardando = alunos.filter((a) => a.statusEmbarque === 'AGUARDANDO').length;
  const est = emRota ? estimativaRota : null;
  const progresso = est ? est.progresso : ativos ? (aBordo + naEscola) / ativos : 0;
  // Com 2+ dependentes a bordo, o mapa indica quem chega primeiro: o de endereço mais próximo da van.
  const aBordoMeus = pai ? alunos.filter((a) => a.statusEmbarque === 'EMBARCADO').length : 0;
  const proximo = pai && emRota && gpsAtivo && aBordoMeus > 0 ? primeiroAChegar(gpsPosicao, alunos, viagemAtiva.tipo_viagem) : null;
  const filho = pai ? proximo?.aluno ?? alunos.find((a) => a.statusEmbarque === 'EMBARCADO') ?? alunos[0] : undefined;
  const destino = viagemAtiva.tipo_viagem === 'VOLTA' ? 'até o fim da rota' : 'até a escola';

  const concluir = async () => {
    setFinishing(true); setErro(null);
    try { await finalizarViagem(); } catch (e) { setErro((e as Error).message); } finally { setFinishing(false); }
  };

  const pill = emRota
    ? <StatusPill tone="signal" live label={est ? `A caminho · ${km(est.km)}` : motorista ? 'Em rota' : 'A caminho'} />
    : concluida ? <StatusPill tone="success" label="Rota concluída" /> : <StatusPill tone="neutral" label="Rota não iniciada" />;

  /* ------------------------------------------------------------------ bloco de tempo / número principal */
  const destaque = (() => {
    if (motorista && !emRota) {
      return { valor: `${ativos}`, sufixo: ativos === 1 ? 'passageiro' : 'passageiros', legenda: `previstos · turno da ${TURNO[viagemAtiva.turno] ?? 'manhã'}`, lado: '', ladoSub: '' };
    }
    if (proximo && aBordoMeus >= 2) {
      const quem = proximo.aluno.nome.split(' ')[0];
      const onde = viagemAtiva.tipo_viagem === 'VOLTA' ? proximo.aluno.endereco_busca : proximo.aluno.endereco_entrega;
      if (isDemo) {
        const min = Math.max(1, Math.round((proximo.km / Math.max(gpsPosicao.velocidade, 15)) * 60));
        return { valor: `${min}`, sufixo: 'min', legenda: `${quem} chega primeiro · ${onde}`, lado: horaPrevista(min), ladoSub: `${km(proximo.km)} de distância` };
      }
      // Dados reais: só distância em linha reta, sem inventar horário de chegada.
      return { valor: proximo.km.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: proximo.km < 10 ? 1 : 0 }), sufixo: 'km', legenda: `${quem} chega primeiro · ${onde}`, lado: '', ladoSub: '' };
    }
    if (est) {
      return { valor: `${est.minutos}`, sufixo: 'min', legenda: destino, lado: horaPrevista(est.minutos), ladoSub: `${aguardando} ${aguardando === 1 ? 'parada restante' : 'paradas restantes'}` };
    }
    if (emRota) {
      // Dados reais: sem previsão confiável — mostramos onde a van está agora.
      return { valor: '', sufixo: '', legenda: gpsAtivo ? gpsPosicao.rua : 'Aguardando sinal da van', lado: gpsPosicao.velocidade ? `${gpsPosicao.velocidade} km/h` : '', ladoSub: `${aguardando} ${aguardando === 1 ? 'parada restante' : 'paradas restantes'}` };
    }
    return null;
  })();

  /* ------------------------------------------------------------------ conteúdo da sheet */
  const vazio = alunos.length === 0;
  const sheet = (
    <>
      <View style={s.grabber} />
      <View style={s.row}>
        {pill}
        <View style={{ flex: 1 }} />
        {emRota ? <Text style={s.meta}>ao vivo</Text> : null}
      </View>

      {vazio ? (
        pai ? (
          <View style={{ marginTop: spacing.md, gap: spacing.md }}>
            <Text style={s.title}>Vamos começar</Text>
            <Text style={s.sub}>Cadastre seu dependente com o código que o motorista passou. Em segundos você já acompanha a van.</Text>
            <Button variant="borderedProminent" label="Adicionar dependente" icon="personAdd" onPress={() => setAddStudent(true)} />
          </View>
        ) : (
          <View style={{ marginTop: spacing.md, gap: spacing.s6 }}>
            <Text style={s.caption}>Seu código de convite</Text>
            <Text style={s.code} selectable accessibilityLabel={`Código ${(codigoConvite ?? '').split('').join(' ')}`}>{codigoConvite ?? '——'}</Text>
            <Text style={s.sub}>{motorista ? 'Passe este código aos responsáveis. Quando cadastrarem o passageiro, ele aparece na sua rota.' : 'Passe este código aos responsáveis para acompanhar as chegadas.'}</Text>
          </View>
        )
      ) : (
        <>
          {destaque ? (
            <View style={s.etaRow}>
              <View style={{ flex: 1 }}>
                {destaque.valor ? (
                  <Text style={s.eta} accessibilityLabel={`${destaque.valor} ${destaque.sufixo} ${destaque.legenda}`}>
                    {destaque.valor}<Text style={s.etaUnit}> {destaque.sufixo}</Text>
                  </Text>
                ) : null}
                <Text style={destaque.valor ? s.sub : s.title} numberOfLines={2}>{destaque.legenda}</Text>
              </View>
              {destaque.lado || destaque.ladoSub ? (
                <View style={s.etaSide}>
                  {destaque.lado ? <Text style={s.etaClock}>{destaque.lado}</Text> : null}
                  {destaque.ladoSub ? <Text style={s.meta}>{destaque.ladoSub}</Text> : null}
                </View>
              ) : null}
            </View>
          ) : (
            <View style={{ marginTop: spacing.md }}>
              <Text style={s.title}>{nomes.transportador ? `${nomes.transportador} ainda não iniciou a rota` : 'A rota de hoje ainda não começou'}</Text>
              <Text style={s.sub}>Avisamos você assim que a van sair.</Text>
            </View>
          )}

          {(emRota || motorista) && ativos > 0 ? (
            <View style={{ marginTop: spacing.lg }}>
              <ProgressBar value={progresso} total={1} tone="signal" accessibilityLabel="Progresso da rota" />
            </View>
          ) : null}

          {/* aluno (pais) */}
          {filho ? (
            <View style={s.child}>
              <Avatar name={filho.nome} onBoard={filho.statusEmbarque === 'EMBARCADO'} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.childName} numberOfLines={1}>{filho.nome}</Text>
                <Text style={s.meta} numberOfLines={1}>
                  {filho.statusEmbarque === 'AGUARDANDO' ? filho.endereco_busca : statusAluno(filho.statusEmbarque).label}
                  {` · ${viagemAtiva.tipo_viagem === 'VOLTA' ? 'Volta para casa' : 'Ida para a escola'}`}
                </Text>
              </View>
              <IconButton icon="chevronRight" label={`Ver ${filho.nome}`} size="sm" variant="gray" onPress={() => go.student(filho.id)} />
            </View>
          ) : null}

          {/* ações */}
          {pai ? (
            <View style={s.actions}>
              <Button style={{ flex: 1 }} label="Mensagem" icon="chat" onPress={() => router.push('/conversa')} />
              <Button style={{ flex: 1 }} variant="bordered" label="Avisar ausência" onPress={() => setAbsence(true)} />
            </View>
          ) : (
            emRota ? (
              <View style={s.actions}>
                <Button style={{ flex: 1 }} label="Concluir rota" icon="flag" onPress={concluir} loading={finishing} />
                <Button style={{ flex: 1 }} variant="tinted" role="destructive" label="Ocorrência" icon="warning" onPress={() => setEmergency(true)} />
              </View>
            ) : (
              <View style={s.actions}>
                <Button style={{ flex: 1 }} variant="filled" label="Iniciar rota" icon="play" onPress={() => setStart(true)} disabled={!temVeiculo && !isDemo} />
              </View>
            )
          )}
        </>
      )}

      {motorista && !temVeiculo && !isDemo ? <View style={{ marginTop: spacing.md }}><Notice tone="warning" message="Cadastre seu veículo para poder iniciar rotas." /></View> : null}
      {erro ? <View style={{ marginTop: spacing.md }}><Notice tone="error" message={erro} /></View> : null}
    </>
  );

  /* ------------------------------------------------------------------ menu "…" */
  const acoes = [
    { label: 'Atualizar', onPress: () => { recarregar().catch(() => {}); } },
    ...(isDemo && emRota ? [{ label: 'Avançar van (simulação)', onPress: simularPassoGps }] : []),
    ...(motorista ? [{ label: 'Veículo', onPress: go.vehicle }] : []),
    ...(pai ? [{ label: 'Adicionar dependente', onPress: () => setAddStudent(true) }] : []),
  ];

  const filhoIdx = filho ? alunos.indexOf(filho) : undefined;

  // Mapa real: cada passageiro aparece onde importa agora (a bordo → onde desce; senão → onde embarca).
  const paradasMapa: MapaParada[] = alunos.flatMap((a) => {
    const casa = a.latitude != null && a.longitude != null ? { latitude: a.latitude, longitude: a.longitude } : null;
    const p = a.statusEmbarque === 'EMBARCADO' ? pontoDeDescida(a, viagemAtiva.tipo_viagem) ?? casa : casa;
    if (!p) return [];
    return [{ id: a.id, nome: a.nome, ...p, status: a.statusEmbarque, destaque: aBordoMeus >= 2 && proximo?.aluno.id === a.id, casa: pai && a.id === filho?.id }];
  });
  const vanGeo = gpsAtivo && gpsPosicao.latitude !== 0 ? { latitude: gpsPosicao.latitude, longitude: gpsPosicao.longitude } : null;
  const mapaReal = process.env.EXPO_OS !== 'web' && (paradasMapa.length > 0 || !!vanGeo);

  return (
    <View style={{ flex: 1, backgroundColor: colors.mapLand }}>
      <Stack.Screen options={{ headerShown: false, title: 'Rota' }} />
      {mapaReal ? (
        <LiveMap
          van={vanGeo}
          vanAtiva={emRota && gpsAtivo}
          trilha={rotaGeo}
          paradas={paradasMapa}
          accessibilityLabel={emRota ? `Mapa da rota. Van em ${gpsPosicao.rua}` : 'Mapa da rota. Van parada'}
        />
      ) : (
        <RouteMap
          step={gpsStep}
          ativo={emRota && gpsAtivo}
          pins={alunos.map((a) => ({ nome: a.nome, status: a.statusEmbarque, parada: a.parada }))}
          homeIndex={filhoIdx}
          accessibilityLabel={emRota ? `Mapa da rota. Van em ${gpsPosicao.rua}` : 'Mapa da rota. Van parada'}
        />
      )}

      {/* botões de vidro sobre o mapa */}
      <SafeAreaView edges={['top']} style={s.top} pointerEvents="box-none">
        <IconButton icon="people" label={motorista ? 'Passageiros' : 'Dependentes'} variant="glass" onPress={() => router.navigate('/(tabs)/(alunos)')} />
        <View style={{ gap: spacing.sm }}>
          <IconButton icon="location" label="Atualizar posição da van" variant="glass" onPress={() => { recarregar().catch(() => {}); }} />
          <PullDownButton label="Mais opções" variant="glass" actions={acoes} />
        </View>
      </SafeAreaView>

      {/* sheet de vidro flutuante */}
      <SafeAreaView edges={['bottom']} style={s.bottom} pointerEvents="box-none">
        <GlassSurface material="thick" style={s.sheet}>
          <View style={s.sheetBody}>{sheet}</View>
        </GlassSurface>
      </SafeAreaView>

      <AbsenceSheet visible={absence} onClose={() => setAbsence(false)} alunoId={filho?.id} />
      <EmergencySheet visible={emergency} onClose={() => setEmergency(false)} />
      <StartRouteSheet visible={start} onClose={() => setStart(false)} />
      <AddStudentSheet visible={addStudent} onClose={() => setAddStudent(false)} />
    </View>
  );
};

const s = StyleSheet.create({
  top: { position: 'absolute', left: 0, right: 0, top: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: layout.gutter, paddingTop: spacing.sm },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  sheet: { borderRadius: radius.sheet },
  sheetBody: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: radius.full, backgroundColor: colors.fill1, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: gap.related },
  meta: { ...type.footnote, color: colors.secondaryLabel },
  etaRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md, marginTop: spacing.md },
  eta: { ...type.eta, color: colors.label },
  etaUnit: { ...type.title3, fontWeight: '700', color: colors.label, letterSpacing: 0 },
  etaSide: { alignItems: 'flex-end', paddingBottom: spacing.xs, gap: 2 },
  etaClock: { ...type.headline, color: colors.label, fontVariant: ['tabular-nums'] },
  title: { ...type.headline, color: colors.label },
  sub: { ...type.subheadline, color: colors.secondaryLabel, marginTop: 2 },
  caption: { ...type.sectionHeader, color: colors.secondaryLabel },
  code: { fontSize: 34, fontWeight: '800', letterSpacing: 6, color: colors.label, fontVariant: ['tabular-nums'] },
  child: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  childName: { ...type.headline, color: colors.label },
  actions: { flexDirection: 'row', gap: gap.related, marginTop: spacing.lg },
});
