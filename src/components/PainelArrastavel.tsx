import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Animated, PanResponder, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/tokens';
import { GlassSurface } from './ui/kit';

const PUXADOR = 36; // área do puxador, única parte visível quando o painel está escondido
export type Pos = 'aberto' | 'recolhido' | 'escondido';

/**
 * Painel de vidro que desliza sobre o mapa. `resumo` fica sempre visível no estado recolhido;
 * `children` só aparece ao arrastar para cima. Arrastar para baixo esconde tudo e libera o mapa.
 * shortcut: só o cabeçalho (puxador + resumo) responde ao arrasto; o conteúdo aberto rola normalmente. Trocar por gesture-handler se precisar arrastar pelo conteúdo.
 */
export const PainelArrastavel: React.FC<{ resumo: React.ReactNode; children?: React.ReactNode; /** a cada mudança, deixa o painel aberto na hora, sem animar (ex.: aparecer expandido sob a tela de conclusão) */ abrir?: number; /** nova posição, depois de qualquer mudança */ onPos?: (p: Pos) => void }> = ({ resumo, children, abrir = 0, onPos }) => {
  const { height } = useWindowDimensions();
  const { bottom, top } = useSafeAreaInsets();
  const altura = height - top; // o painel termina na barra de status; a camada de tela cheia estende o fundo por cima dela
  const [resumoH, setResumoH] = useState(160);
  const [pos, setPos] = useState<Pos>('recolhido');

  // y = deslocamento para baixo; 0 = aberto.
  const alvo = useMemo(() => ({
    aberto: 0,
    recolhido: Math.max(0, altura - (PUXADOR + resumoH + bottom + spacing.sm)),
    escondido: altura - PUXADOR - bottom - spacing.md, // acima da barra inicial do iPhone, para o gesto de voltar ao início não roubar o toque
  }), [altura, resumoH, bottom]);
  const y = useRef(new Animated.Value(alvo.recolhido)).current;
  const atual = useRef(alvo.recolhido);
  // tudo anima só transform/opacidade (driver nativo): a "tela cheia" é um fundo que dissolve sobre o cartão flutuante, sem relayout por quadro
  const inicio = useRef(0);
  const alvoRef = useRef(alvo);
  alvoRef.current = alvo;

  useEffect(() => { y.addListener(({ value }) => { atual.current = value; }); return () => y.removeAllListeners(); }, [y]);
  const montado = useRef(false);
  useEffect(() => { // o conteúdo mudou de altura: a mola leva ao novo alvo a partir de onde o painel está (sem salto)
    if (!montado.current) { montado.current = true; y.setValue(alvo[pos]); return; }
    const a = Animated.spring(y, { toValue: alvo[pos], useNativeDriver: true, damping: 26, stiffness: 220, mass: 0.8 });
    a.start();
    return () => a.stop();
  }, [alvo]); // eslint-disable-line react-hooks/exhaustive-deps

  const posRef = useRef(pos); // `ir` roda dentro do PanResponder (criado uma vez), então lê a posição por ref
  posRef.current = pos;
  const ir = (p: Pos) => {
    if (p !== posRef.current && process.env.EXPO_OS === 'ios') Haptics.selectionAsync().catch(() => {}); // o painel "encaixa" num ponto de parada
    setPos(p);
    Animated.spring(y, { toValue: alvoRef.current[p], useNativeDriver: true, damping: 22, stiffness: 220, mass: 0.8 }).start();
  };

  useEffect(() => { if (abrir) { setPos('aberto'); y.setValue(alvoRef.current.aberto); } }, [abrir]); // eslint-disable-line react-hooks/exhaustive-deps
  const primeiraPos = useRef(true);
  const onPosRef = useRef(onPos);
  onPosRef.current = onPos;
  useEffect(() => { if (primeiraPos.current) { primeiraPos.current = false; return; } onPosRef.current?.(pos); }, [pos]);

  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderGrant: () => { inicio.current = atual.current; },
    onPanResponderMove: (_, g) => y.setValue(Math.min(alvoRef.current.escondido, Math.max(0, inicio.current + g.dy))),
    onPanResponderRelease: (_, g) => {
      const projetado = atual.current + g.vy * 180;
      const t = alvoRef.current;
      const perto = (Object.keys(t) as Pos[]).reduce((a, b) => (Math.abs(t[b] - projetado) < Math.abs(t[a] - projetado) ? b : a));
      ir(perto);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const ordem: Pos[] = ['aberto', 'recolhido', 'escondido'];
  const passo = (d: 1 | -1) => ir(ordem[Math.min(2, Math.max(0, ordem.indexOf(pos) + d))]);

  const cheia = y.interpolate({ inputRange: [0, Math.max(1, alvo.recolhido * 0.4)], outputRange: [1, 0], extrapolate: 'clamp' });
  const flutuante = y.interpolate({ inputRange: [0, Math.max(1, alvo.recolhido * 0.4)], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <Animated.View style={[s.wrap, { height: altura, transform: [{ translateY: y }] }]} pointerEvents="box-none">
      {/* cartão flutuante (cantos redondos, margens) some quando o painel sobe; o fundo de tela cheia (sem margens, sob a barra de status) aparece */}
      <Animated.View style={[s.camada, { opacity: flutuante }]} pointerEvents="none"><GlassSurface material="thick" style={s.sheet}><View style={s.cheio} /></GlassSurface></Animated.View>
      <Animated.View style={[s.camada, s.telaCheia, { top: -top, opacity: cheia }]} pointerEvents="none"><GlassSurface material="thick" floating={false} style={[s.sheet, { borderRadius: 0 }]}><View style={s.cheio} /></GlassSurface></Animated.View>
      <View style={s.conteudo} pointerEvents="box-none">
        <View {...pan.panHandlers}>
          <View
            style={s.puxadorBox}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Painel da viagem"
            accessibilityValue={{ text: pos === 'aberto' ? 'aberto' : pos === 'recolhido' ? 'recolhido' : 'escondido' }}
            accessibilityActions={[{ name: 'increment', label: 'Abrir mais' }, { name: 'decrement', label: 'Recolher' }]}
            onAccessibilityAction={(e) => passo(e.nativeEvent.actionName === 'increment' ? -1 : 1)}
          >
            <View style={s.puxador} />
          </View>
          <View style={s.corpo} onLayout={(e) => setResumoH(e.nativeEvent.layout.height)}>{resumo}</View>
        </View>
        {children ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[s.corpo, { paddingBottom: bottom + spacing.xl }]}
            scrollEnabled={pos === 'aberto'}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : null}
      </View>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  camada: { position: 'absolute', top: 0, bottom: 0, left: spacing.sm, right: spacing.sm },
  telaCheia: { left: 0, right: 0 },
  cheio: { flex: 1 },
  conteudo: { flex: 1, marginHorizontal: spacing.sm },
  sheet: { flex: 1, borderRadius: radius.sheet },
  puxadorBox: { height: PUXADOR, alignItems: 'center', justifyContent: 'center' },
  puxador: { width: 36, height: 5, borderRadius: radius.full, backgroundColor: colors.fill1 },
  corpo: { paddingHorizontal: spacing.xl },
});
