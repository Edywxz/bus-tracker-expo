import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { motion, radius, spacing } from '../theme/tokens';
import { type } from '../theme/type';
import { Icon } from './ds/icon';

interface Props {
  /** Dependentes que desembarcaram (responsável) ou todos os entregues (motorista). */
  entregues: { nome: string; escola_nome?: string | null }[];
  tipo: 'IDA' | 'VOLTA';
  hora: Date;
  motorista?: boolean;
  /** Sai do painel (mola criticamente amortecida, sem overshoot); `onSaiu` ao terminar. */
  saindo?: boolean;
  onSaiu?: () => void;
}

const primeiro = (n: string) => n.split(' ')[0];
const lista = (n: string[]) => (n.length > 1 ? `${n.slice(0, -1).join(', ')} e ${n[n.length - 1]}` : n[0]);

/** Fim da corrida: confirma, de forma clara, que o dependente chegou em segurança. Aparece uma vez (estado raro, vale um destaque). */
export const ChegadaSegura: React.FC<Props> = ({ entregues, tipo, hora, motorista, saindo, onSaiu }) => {
  const quando = hora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const n = entregues.length;
  const nomes = lista(entregues.map((e) => primeiro(e.nome)));

  const titulo = motorista || !n ? 'Rota concluída' : n === 1 ? `${nomes} chegou em segurança` : `${nomes} chegaram em segurança`;
  const sub = motorista
    ? `${n} ${n === 1 ? 'aluno entregue' : 'alunos entregues'} em segurança · ${quando}`
    : tipo === 'VOLTA' ? `Entregue em casa às ${quando}.` : `Desembarque confirmado na escola às ${quando}.`;

  // Um disparo só (estado raro): o cartão aparece e o selo "pousa" logo depois. Com "reduzir movimento", só opacidade.
  const [reduzir, setReduzir] = useState(false);
  const card = useRef(new Animated.Value(0)).current;
  const selo = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then((r) => {
      if (!vivo) return;
      setReduzir(!!r);
      const t = (v: Animated.Value, delay: number) =>
        Animated.timing(v, { toValue: 1, duration: r ? motion.duration.fast : motion.duration.slow, delay: r ? 0 : delay, easing: motion.easing, useNativeDriver: true });
      Animated.parallel([t(card, 0), t(selo, 120)]).start();
    });
    return () => { vivo = false; };
  }, [card, selo]);
  const saida = useRef(new Animated.Value(0)).current; // 0 = no painel, 1 = fora
  const aoSair = useRef(onSaiu);
  aoSair.current = onSaiu;
  useEffect(() => {
    // Parte do valor atual (interrompível): se `saindo` voltar a false, a mola leva de volta sem saltar.
    const a = reduzir
      ? Animated.timing(saida, { toValue: saindo ? 1 : 0, duration: motion.duration.fast, useNativeDriver: true })
      : Animated.spring(saida, { toValue: saindo ? 1 : 0, stiffness: 300, damping: 35, mass: 1, useNativeDriver: true });
    a.start(({ finished }) => { if (finished && saindo) aoSair.current?.(); });
    return () => a.stop();
  }, [saindo, reduzir, saida]);
  const escala = (v: Animated.Value, de: number) => (reduzir ? 1 : v.interpolate({ inputRange: [0, 1], outputRange: [de, 1] }));

  return (
    <Animated.View style={[st.card, {
      opacity: Animated.multiply(card, saida.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: 'clamp' })),
      transform: reduzir ? [] : [{ scale: Animated.multiply(escala(card, 0.95), saida.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] })) }, { translateY: saida.interpolate({ inputRange: [0, 1], outputRange: [0, 12] }) }],
    }]} accessibilityRole="alert" accessibilityLiveRegion="polite" accessibilityLabel={`${titulo}. ${sub}`}>
      <Animated.View style={[st.selo, { opacity: selo, transform: [{ scale: escala(selo, 0.6) }] }]}>
        <Icon name="checkCircle" size={44} color={colors.success} />
      </Animated.View>
      <Text style={st.titulo} selectable>{titulo}</Text>
      <Text style={st.sub} selectable>{sub}</Text>
      {!motorista && n > 0 ? (
        <View style={st.lista}>
          {entregues.map((e, i) => (
            <View key={i} style={st.linha}>
              <Icon name="check" size={14} color={colors.onSuccessContainer} />
              <Text style={st.linhaTexto} numberOfLines={1}>
                {primeiro(e.nome)}{tipo === 'IDA' && e.escola_nome ? ` · ${e.escola_nome}` : tipo === 'VOLTA' ? ' · em casa' : ''}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
};

const st = StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.xs, padding: spacing.lg, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: colors.successContainer },
  selo: { marginBottom: spacing.xs },
  titulo: { ...type.title3, fontWeight: '700', color: colors.onSuccessContainer, textAlign: 'center' },
  sub: { ...type.subheadline, color: colors.onSuccessContainer, textAlign: 'center' },
  lista: { marginTop: spacing.sm, gap: 4, alignSelf: 'stretch' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, justifyContent: 'center' },
  linhaTexto: { ...type.footnote, color: colors.onSuccessContainer, fontVariant: ['tabular-nums'] },
});
