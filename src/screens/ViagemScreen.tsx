import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { animateNextLayout, gap, layout, spacing } from '../theme/tokens';
import { type } from '../theme/type';
import {
  Button, IconButton, Notice, ProgressBar, PullDownButton, StatusPill,
} from '../components/ui/kit';
import { RouteMap } from '../components/RouteMap';
import { ChegadaSegura } from '../components/ChegadaSegura';
import { ChegadaTelaCheia } from '../components/ChegadaTelaCheia';
import { LiveMap, type MapaParada } from '../components/LiveMap';
import { useApp } from '../context/AppContext';
import { go } from '../navigation/routes';
import { PainelArrastavel } from '../components/PainelArrastavel';
import { useControlesSimulacao } from '../components/useControlesSimulacao';
import { ListaAlunos } from '../components/ListaAlunos';
import { distanciaKm } from '../utils/proximidade';
import { avisoEncerrar } from '../utils/encerrarRota';
import { confirm } from '../components/ds/modality';
import { vanVisivel } from '../services/simulacao';
import { mensagemErro } from '../utils/format';
import { lembrete } from '../utils/lembrete';
import { pontoDeDescida, primeiroAChegar } from '../utils/proximidade';
import { AbsenceSheet, AddStudentSheet, EmergencySheet, StartRouteSheet } from '../sheets/Sheets';
import { SimulacaoSheet } from '../sheets/SimulacaoSheet';

const TURNO: Record<string, string> = { MANHA: 'manhã', TARDE: 'tarde', INTEGRAL: 'integral', NOITE: 'noite' };

/** Hora prevista "~6h52" a partir de minutos à frente. */
const horaPrevista = (min: number) => {
  const d = new Date(Date.now() + min * 60000);
  return `~${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
};
const km = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: v < 10 ? 1 : 0 })} km`;

/**
 * Viagem — primeira tela. Mapa em tela cheia + painel arrastável: recolhido mostra status, aviso, tempo e ações;
 * aberto mostra os dependentes/passageiros; escondido libera o mapa. O conteúdo muda por perfil (pais ou motorista).
 */
export const ViagemScreen: React.FC = () => {
  const {
    role, alunos, viagemAtiva, temViagem, temVeiculo, gpsPosicao, gpsAtivo, gpsStep, isDemo, estimativaRota, rotaGeo, recalcularRota, previsoes, gpsNegado,
    finalizarViagem, codigoConvite, recarregar, nomes, eventosCalendario, horaSimulada, paradasSim, simulacao,
  } = useApp();
  const [relogio, setAgora] = useState(() => new Date());
  const agora = horaSimulada ?? relogio;
  useEffect(() => { const i = setInterval(() => setAgora(new Date()), 30000); return () => clearInterval(i); }, []);
  const [absence, setAbsence] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [start, setStart] = useState(false);
  const [addStudent, setAddStudent] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [simular, setSimular] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const emRota = viagemAtiva.status === 'EM_ANDAMENTO';
  const concluida = temViagem && viagemAtiva.status === 'CONCLUIDA';
  const motorista = role === 'TRANSPORTADOR';
  // Tela cheia de chegada só quando a corrida termina com a tela aberta (não ao abrir uma corrida já concluída).
  const [chegada, setChegada] = useState(false);
  const eraConcluida = useRef(concluida);
  useEffect(() => {
    if (concluida && !eraConcluida.current) setChegada(true);
    eraConcluida.current = concluida;
  }, [concluida]);
  // 5 s depois da tela cheia (ou ao abrir já concluída) o cartão "Rota concluída" sai e o painel volta ao padrão.
  const [saindo, setSaindo] = useState(false);
  const [resumoVisto, setResumoVisto] = useState(false);
  useEffect(() => {
    if (!concluida) { setSaindo(false); setResumoVisto(false); return; }
    if (chegada) return;
    const t = setTimeout(() => setSaindo(true), 5000);
    return () => clearTimeout(t);
  }, [concluida, chegada]);
  const concluidaNoPainel = concluida && !resumoVisto;
  const pai = role === 'RESPONSAVEL';
  const entregues = alunos.filter((a) => a.statusEmbarque === 'DESEMBARCADO');
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

  // Responsável (dados reais): tempo até a van chegar ao dependente que tem a chegada mais próxima. Só entram os dependentes dele (RLS).
  const proximaChegada = (() => {
    if (!pai || !emRota || isDemo) return null;
    const cand = alunos.flatMap((a) => {
      const p = previsoes[a.id];
      const min = a.statusEmbarque === 'AGUARDANDO' ? p?.busca : a.statusEmbarque === 'EMBARCADO' ? p?.entrega : undefined;
      return min == null ? [] : [{ aluno: a, min, busca: a.statusEmbarque === 'AGUARDANDO' }];
    });
    return cand.sort((x, y) => x.min - y.min)[0] ?? null;
  })();

  // Distância da van até a parada que ela atende agora (ida: quem espera; volta: quem está a bordo).
  const kmVan = (() => {
    if (!pai || !emRota || !gpsAtivo) return null;
    const alvo = viagemAtiva.tipo_viagem === 'VOLTA' ? 'EMBARCADO' : 'AGUARDANDO';
    const ds = alunos.filter((a) => a.statusEmbarque === alvo && a.latitude != null && a.longitude != null)
      .map((a) => distanciaKm(gpsPosicao, { latitude: a.latitude!, longitude: a.longitude! }));
    return ds.length ? Math.min(...ds) : null;
  })();
  // Demo (responsável): a van só aparece nos últimos 5 min até a parada dos filhos; fora disso o app só avisa que a rota começou.
  const demoPai = isDemo && pai;
  const vanSim = demoPai && simulacao ? vanVisivel(simulacao.linha, simulacao.t, alunos.map((a) => a.id)) : null;
  const vanAparece = !demoPai || !!vanSim?.visivel;
  const aviso = demoPai && !simulacao ? null : pai ? lembrete({ agora, alunos, eventos: eventosCalendario, emRota, tipo: viagemAtiva.tipo_viagem, concluida: concluidaNoPainel, kmVan }) : null;

  // Simulação (responsável): quantas paradas de outros passageiros faltam antes da próxima parada do filho.
  const proxPropria = paradasSim ? paradasSim.findIndex((p) => p.propria && !p.feita) : -1;
  const antes = paradasSim && proxPropria >= 0 ? paradasSim.slice(0, proxPropria).filter((p) => !p.feita).length : null;
  const restantes = antes == null ? `${aguardando} ${aguardando === 1 ? 'parada restante' : 'paradas restantes'}`
    : antes === 0 ? 'Próxima parada é a do seu filho' : `${antes} ${antes === 1 ? 'parada' : 'paradas'} antes da sua`;

  const concluir = async () => {
    const aviso = avisoEncerrar(alunos.map((a) => a.statusEmbarque));
    if (!(await confirm({ title: aviso.title, message: aviso.message, confirmLabel: 'Encerrar rota', destructive: aviso.destructive }))) return;
    setFinishing(true); setErro(null);
    try { await finalizarViagem(); } catch (e) { setErro(mensagemErro(e)); } finally { setFinishing(false); }
  };

  const pill = emRota
    ? <StatusPill tone="signal" live label={est ? `A caminho · ${km(est.km)}` : motorista ? 'Em rota' : 'A caminho'} />
    : null; // sem rota ativa (ou já concluída) não há marcador: o texto abaixo já diz

  /* ------------------------------------------------------------------ bloco de tempo / número principal */
  const destaque = (() => {
    if (concluidaNoPainel && (pai || motorista)) return null; // a confirmação de chegada ocupa o lugar da previsão
    if (motorista && !emRota) {
      return { valor: `${ativos}`, sufixo: ativos === 1 ? 'passageiro' : 'passageiros', legenda: `previstos · turno da ${TURNO[viagemAtiva.turno] ?? 'manhã'}`, lado: '', ladoSub: '' };
    }
    if (demoPai && emRota) {
      if (!vanSim?.visivel) return { valor: '', sufixo: '', legenda: `${nomes.transportador ?? 'O motorista'} iniciou a rota`, lado: '', ladoSub: restantes };
      const quem = alunos.filter((a) => a.statusEmbarque !== 'AUSENTE').map((a) => a.nome.split(' ')[0]).join(' e ');
      const busca = aguardando > 0 === (viagemAtiva.tipo_viagem === 'IDA');
      const legenda = busca ? `Van chega para buscar ${quem}` : viagemAtiva.tipo_viagem === 'VOLTA' ? `${quem} chega em casa` : `${quem} chega à escola`;
      return { valor: `${vanSim.minutos}`, sufixo: 'min', legenda, lado: horaPrevista(vanSim.minutos), ladoSub: 'previsão aproximada' };
    }
    if (proximaChegada) {
      const quem = proximaChegada.aluno.nome.split(' ')[0];
      const legenda = proximaChegada.busca
        ? `Van chega para buscar ${quem}`
        : viagemAtiva.tipo_viagem === 'VOLTA' ? `${quem} chega em casa` : `${quem} chega à escola`;
      const min = Math.max(1, proximaChegada.min);
      return { valor: `${min}`, sufixo: 'min', legenda, lado: horaPrevista(min), ladoSub: 'previsão aproximada' };
    }
    if (proximo && aBordoMeus >= 2) {
      const alvo = pontoDeDescida(proximo.aluno, viagemAtiva.tipo_viagem);
      const juntos = alunos.filter((a) => {
        const d = a.statusEmbarque === 'EMBARCADO' ? pontoDeDescida(a, viagemAtiva.tipo_viagem) : null;
        return !!d && !!alvo && d.latitude === alvo.latitude && d.longitude === alvo.longitude;
      }).map((a) => a.nome.split(' ')[0]);
      const quem = juntos.length > 1 ? `${juntos.slice(0, -1).join(', ')} e ${juntos[juntos.length - 1]}` : proximo.aluno.nome.split(' ')[0];
      const onde = viagemAtiva.tipo_viagem === 'VOLTA' ? proximo.aluno.endereco_busca : proximo.aluno.endereco_entrega;
      if (isDemo) {
        const min = Math.max(1, Math.round((proximo.km / Math.max(gpsPosicao.velocidade, 15)) * 60));
        return { valor: `${min}`, sufixo: 'min', legenda: `${quem} ${juntos.length > 1 ? 'chegam' : 'chega primeiro'} · ${onde}`, lado: horaPrevista(min), ladoSub: `${km(proximo.km)} de distância` };
      }
      // Dados reais: só distância em linha reta, sem inventar horário de chegada.
      return { valor: proximo.km.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: proximo.km < 10 ? 1 : 0 }), sufixo: 'km', legenda: `${quem} ${juntos.length > 1 ? 'chegam' : 'chega primeiro'} · ${onde}`, lado: '', ladoSub: '' };
    }
    if (est) {
      return { valor: `${est.minutos}`, sufixo: 'min', legenda: destino, lado: horaPrevista(est.minutos), ladoSub: restantes };
    }
    if (emRota) {
      // Dados reais: sem previsão confiável — mostramos onde a van está agora.
      return { valor: '', sufixo: '', legenda: gpsAtivo ? gpsPosicao.rua : motorista && gpsNegado ? 'Permita a localização para mostrar a van' : motorista ? 'Buscando sua posição…' : 'Aguardando sinal da van', lado: gpsPosicao.velocidade ? `${gpsPosicao.velocidade} km/h` : '', ladoSub: `${aguardando} ${aguardando === 1 ? 'parada restante' : 'paradas restantes'}` };
    }
    return null;
  })();

  /* ------------------------------------------------------------------ conteúdo da sheet */
  const vazio = alunos.length === 0;
  const sheet = (
    <>
      <View style={s.row}>
        {pill}
        <View style={{ flex: 1 }} />
        {emRota ? <Text style={s.meta}>ao vivo</Text> : null}
      </View>

      {concluidaNoPainel && (pai || alunos.length > 0) ? (
        <View style={{ marginTop: spacing.md }}>
          <ChegadaSegura entregues={entregues} tipo={viagemAtiva.tipo_viagem} hora={agora} motorista={motorista} saindo={saindo} onSaiu={() => { animateNextLayout(); setResumoVisto(true); }} />
        </View>
      ) : null}

      {aviso ? <View style={{ marginTop: spacing.md }}><Notice tone={aviso.tone} message={aviso.texto} icon={concluidaNoPainel ? 'school' : aviso.tone === 'warning' ? 'warning' : 'calendar'} /></View> : null}

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
          ) : concluidaNoPainel ? null : (
            <View style={{ marginTop: spacing.md }}>
              <Text style={s.title}>{nomes.transportador ? `${nomes.transportador} ainda não iniciou a rota` : 'A rota de hoje ainda não começou'}</Text>
              <Text style={s.sub}>Avisamos você assim que a van sair.</Text>
            </View>
          )}

          {emRota && ativos > 0 ? (
            <View style={{ marginTop: spacing.lg }}>
              <ProgressBar value={progresso} total={1} tone="signal" accessibilityLabel="Progresso da rota" />
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
  const controles = useControlesSimulacao();
  const acoes = [
    { label: 'Atualizar', onPress: () => { recarregar().catch(() => {}); } },
    ...(isDemo && !controles.acoes.length ? [{ label: 'Simular viagem', onPress: () => setSimular(true) }] : []),
    ...controles.acoes,
    ...(motorista && !isDemo ? [{ label: 'Recalcular rota', onPress: recalcularRota }] : []),
    ...(motorista ? [{ label: 'Veículo', onPress: go.vehicle }] : []),
    ...(pai ? [{ label: 'Adicionar dependente', onPress: () => setAddStudent(true) }] : []),
  ];

  const filhoIdx = filho ? alunos.indexOf(filho) : undefined;

  // Mapa real: cada passageiro aparece onde importa agora (a bordo → onde desce; senão → onde embarca).
  const escolas = new Map<string, MapaParada>(); // destinos da rota, um marcador por local (vários alunos vão à mesma escola)
  const filhosDaEscola = new Map<string, string[]>();
  const alunosDaEscola = new Map<string, typeof alunos>(); // quem não está ausente, para saber quando a escola está "concluída"
  const primeiroNome = (n: string) => n.split(' ')[0];
  const junta = (n: string[]) => (n.length > 1 ? `${n.slice(0, -1).join(', ')} e ${n[n.length - 1]}` : n[0]);
  for (const a of alunos) {
    if (a.entrega_latitude == null || a.entrega_longitude == null) continue;
    const chave = `${a.entrega_latitude},${a.entrega_longitude}`;
    filhosDaEscola.set(chave, [...(filhosDaEscola.get(chave) ?? []), primeiroNome(a.nome)]);
    if (a.statusEmbarque !== 'AUSENTE') alunosDaEscola.set(chave, [...(alunosDaEscola.get(chave) ?? []), a]);
    escolas.set(chave, {
      id: `escola-${chave}`, nome: a.escola_nome ?? 'Escola',
      latitude: a.entrega_latitude, longitude: a.entrega_longitude, status: 'AGUARDANDO', escola: true,
    });
  }
  // Responsável: "Escola de Lucas" diz onde cada filho estuda (o motorista continua vendo o nome da escola).
  for (const [chave, e] of escolas) {
    const nome = pai ? `Escola de ${junta(filhosDaEscola.get(chave)!)}` : e.nome;
    // Ida: concluída quando todos desembarcaram nela. Volta: quando todos já saíram dela.
    const quem = alunosDaEscola.get(chave) ?? [];
    const feito = quem.length > 0 && quem.every((a) => (viagemAtiva.tipo_viagem === 'VOLTA' ? a.statusEmbarque !== 'AGUARDANDO' : a.statusEmbarque === 'DESEMBARCADO'));
    escolas.set(chave, { ...e, nome, rotulo: nome, status: feito ? 'DESEMBARCADO' : 'AGUARDANDO' });
  }
  const paradasOutros: MapaParada[] = (paradasSim ?? []).filter((p) => !p.propria && !p.feita)
    .map((p) => ({ id: p.id, nome: p.rotulo, rotulo: '', latitude: p.latitude, longitude: p.longitude, status: 'AGUARDANDO' as const }));
  // Só há pinos de van, escola e residência: os alunos viajam com a van e, fora dela, estão na escola ou em casa.
  // Irmãos no mesmo endereço dividem a residência.
  const residencias = new Map<string, { pin: MapaParada; nomes: string[] }>();
  for (const a of alunos) {
    if (a.latitude == null || a.longitude == null) continue;
    const chave = `${a.latitude},${a.longitude}`;
    const r = residencias.get(chave);
    if (r) { r.nomes.push(primeiroNome(a.nome)); continue; }
    residencias.set(chave, { pin: { id: `casa-${chave}`, nome: a.nome, latitude: a.latitude, longitude: a.longitude, status: 'AGUARDANDO', casa: true }, nomes: [primeiroNome(a.nome)] });
  }
  const paradasMapa: MapaParada[] = [...paradasOutros, ...escolas.values(),
    ...[...residencias.values()].map(({ pin, nomes }) => ({ ...pin, rotulo: pai ? 'Minha casa' : junta(nomes) }))];
  const vanGeo = gpsAtivo && gpsPosicao.latitude !== 0 && !(pai && concluida) && vanAparece ? { latitude: gpsPosicao.latitude, longitude: gpsPosicao.longitude } : null;
  const mapaReal = process.env.EXPO_OS !== 'web' && (paradasMapa.length > 0 || !!vanGeo);

  return (
    <View style={{ flex: 1, backgroundColor: colors.mapLand }}>
      <Stack.Screen options={{ headerShown: false, title: 'Viagem' }} />
      {mapaReal ? (
        <LiveMap
          van={vanGeo}
          vanAtiva={emRota && gpsAtivo}
          trilha={(isDemo && !emRota) || !vanAparece ? [] : rotaGeo} // demo sem corrida: nada de trajeto desenhado
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
        <IconButton icon="location" label="Atualizar posição da van" variant="glass" onPress={() => { recarregar().catch(() => {}); }} />
        <PullDownButton label="Mais opções" title={controles.titulo} variant="glass" actions={acoes} />
      </SafeAreaView>

      <PainelArrastavel resumo={<View style={{ paddingBottom: spacing.md }}>{sheet}</View>}>
        {vazio ? null : <ListaAlunos onAdicionar={() => setAddStudent(true)} />}
      </PainelArrastavel>

      <AbsenceSheet visible={absence} onClose={() => setAbsence(false)} alunoId={filho?.id} />
      <EmergencySheet visible={emergency} onClose={() => setEmergency(false)} />
      <StartRouteSheet visible={start} onClose={() => setStart(false)} />
      <AddStudentSheet visible={addStudent} onClose={() => setAddStudent(false)} />
      {controles.sheet}
      <SimulacaoSheet visible={simular} onClose={() => setSimular(false)} />
      {chegada ? (
        <ChegadaTelaCheia
          titulo={motorista ? 'Rota concluída' : entregues.length === 1 ? `${entregues[0].nome.split(' ')[0]} chegou em segurança` : 'Seus filhos chegaram em segurança'}
          sub={motorista ? (entregues.length ? `${entregues.length} ${entregues.length === 1 ? 'aluno entregue' : 'alunos entregues'} em segurança` : 'Rota encerrada') : viagemAtiva.tipo_viagem === 'VOLTA' ? 'Entregue em casa' : 'Desembarque confirmado na escola'}
          onFim={() => setChegada(false)} />
      ) : null}
    </View>
  );
};

const s = StyleSheet.create({
  top: { position: 'absolute', left: 0, right: 0, top: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: layout.gutter, paddingTop: spacing.sm },
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
  actions: { flexDirection: 'row', gap: gap.related, marginTop: spacing.lg },
});
