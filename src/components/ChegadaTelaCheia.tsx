import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { motion, spacing } from '../theme/tokens';
import { type } from '../theme/type';
import { Icon } from './ds/icon';

interface Props { titulo: string; sub: string; onFim: () => void }

const EXPANDE_MS = 650;
const LEITURA_MS = 1800;

/**
 * Fim da corrida em tela cheia: o verde se expande do centro até cobrir tudo, o texto aparece, e o branco volta com o
 * mesmo efeito. Toque para pular. Com "reduzir movimento", só esmaece (sem expansão).
 */
export const ChegadaTelaCheia: React.FC<Props> = ({ titulo, sub, onFim }) => {
  const { width: w, height: h } = useWindowDimensions();
  const d = Math.hypot(w, h) + 8; // diâmetro que, saindo do centro, cobre os cantos
  const verde = useRef(new Animated.Value(0)).current;
  const branco = useRef(new Animated.Value(0)).current;
  const texto = useRef(new Animated.Value(0)).current;
  const saida = useRef(new Animated.Value(1)).current;
  const [reduzir, setReduzir] = useState<boolean | null>(null);
  const fim = useRef(onFim);
  fim.current = onFim;

  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then((r) => setReduzir(!!r)); }, []);

  useEffect(() => {
    if (reduzir === null) return;
    const t = (v: Animated.Value, to: number, duration: number) => Animated.timing(v, { toValue: to, duration, easing: motion.easing, useNativeDriver: true });
    AccessibilityInfo.announceForAccessibility(`${titulo}. ${sub}`);
    const haptico = setTimeout(() => {
      if (process.env.EXPO_OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, reduzir ? 0 : EXPANDE_MS);
    const anim = Animated.sequence([
      t(verde, 1, reduzir ? motion.duration.fast : EXPANDE_MS),
      t(texto, 1, motion.duration.slow),
      Animated.delay(LEITURA_MS),
      t(texto, 0, motion.duration.base),
      reduzir ? t(saida, 0, motion.duration.base) : Animated.sequence([t(branco, 1, EXPANDE_MS), t(saida, 0, motion.duration.base)]),
    ]);
    anim.start(({ finished }) => { if (finished) fim.current(); });
    return () => { clearTimeout(haptico); anim.stop(); };
  }, [reduzir]); // eslint-disable-line react-hooks/exhaustive-deps

  const raio = (v: Animated.Value) => ({
    position: 'absolute' as const, left: (w - d) / 2, top: (h - d) / 2, width: d, height: d, borderRadius: d / 2,
    transform: [{ scale: reduzir ? 1 : v.interpolate({ inputRange: [0, 1], outputRange: [0.02, 1] }) }],
    opacity: reduzir ? v : 1,
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: saida, overflow: 'hidden', zIndex: 100 }]} accessibilityViewIsModal>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => fim.current()} accessibilityRole="button" accessibilityLabel="Fechar aviso de chegada">
        <Animated.View style={[raio(verde), { backgroundColor: colors.success }]} pointerEvents="none" />
        <Animated.View style={[raio(branco), { backgroundColor: colors.systemBg }]} pointerEvents="none" />
        <Animated.View style={[st.centro, { opacity: texto, transform: [{ translateY: texto.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]} pointerEvents="none">
          <Icon name="checkCircle" size={72} color={colors.onSuccess} />
          <Text style={st.titulo}>{titulo}</Text>
          <Text style={st.sub}>{sub}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const st = StyleSheet.create({
  centro: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  titulo: { ...type.title1, fontWeight: '800', color: colors.onSuccess, textAlign: 'center' },
  sub: { ...type.body, color: colors.onSuccess, textAlign: 'center', opacity: 0.9 },
});
