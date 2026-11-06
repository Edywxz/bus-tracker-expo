/**
 * Status e extensões de domínio: badge, avatar, status pill, notice, empty state, skeleton, stat,
 * marcadores do mapa, linha do tempo da rota e balões de mensagem.
 */
import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/tokens';
import { type } from '../../theme/type';
import { Icon, IconName } from './icon';

/* ------------------------------------------------------------------ hooks */
function useReduceMotion() {
  const [r, setR] = React.useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setR).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setR);
    return () => sub.remove();
  }, []);
  return r;
}

function usePulse(active: boolean, duration = 1600) {
  const v = useRef(new Animated.Value(0)).current;
  const reduce = useReduceMotion();
  useEffect(() => {
    if (!active || reduce) { v.setValue(0); return; }
    const l = Animated.loop(Animated.timing(v, { toValue: 1, duration, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    l.start();
    return () => l.stop();
  }, [active, reduce, v, duration]);
  return v;
}

/* ------------------------------------------------------------------ Badge */
/** Contagem ou ponto. Vermelho do sistema por padrão; neutro para contagens informativas; signal = AO VIVO. */
export const Badge: React.FC<{ count?: number; label?: string; dot?: boolean; tone?: 'alert' | 'neutral' | 'signal' }> = ({ count, label, dot, tone = 'alert' }) => {
  const bg = tone === 'neutral' ? colors.fill2 : tone === 'signal' ? colors.signal : colors.error;
  const fg = tone === 'neutral' ? colors.label : tone === 'signal' ? colors.onSignal : colors.onError;
  if (dot) return <View style={{ width: 10, height: 10, borderRadius: radius.full, backgroundColor: bg }} accessibilityLabel="Novo" />;
  const text = label ?? (count !== undefined ? (count > 99 ? '99+' : String(count)) : '');
  return (
    <View style={[bd.box, { backgroundColor: bg }]} accessibilityLabel={label ?? `${count} novos`}>
      <Text style={[bd.text, { color: fg }]} maxFontSizeMultiplier={1.3}>{text}</Text>
    </View>
  );
};
const bd = StyleSheet.create({
  box: { minWidth: 20, height: 20, paddingHorizontal: spacing.s6, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
});

/* ------------------------------------------------------------------ Avatar */
const SIZES = { sm: 30, md: 40, lg: 64 } as const;
/** Iniciais em fundo neutro (foto opcional, protegida pela LGPD). Anel amarelo = aluno na van agora. */
export const Avatar: React.FC<{ name: string; size?: keyof typeof SIZES | number; onBoard?: boolean }> = ({ name, size = 'md', onBoard }) => {
  const d = typeof size === 'number' ? size : SIZES[size];
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  return (
    <View style={[onBoard && { padding: 2, borderRadius: radius.full, borderWidth: 2, borderColor: colors.signal }]}>
      <View style={{ width: d, height: d, borderRadius: radius.full, backgroundColor: colors.fill2, alignItems: 'center', justifyContent: 'center' }}
        accessible accessibilityLabel={onBoard ? `${name}, na van` : name}>
        <Text style={{ fontSize: Math.round(d * 0.38), fontWeight: '600', color: colors.label }} maxFontSizeMultiplier={1}>{initials}</Text>
      </View>
    </View>
  );
};

/* ------------------------------------------------------------------ Status pill */
export type PillTone = 'signal' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
const PILL: Record<PillTone, { bg: string; fg: string }> = {
  signal: { bg: colors.signal, fg: colors.onSignal },
  success: { bg: colors.successContainer, fg: colors.onSuccessContainer },
  warning: { bg: colors.warningContainer, fg: colors.onWarningContainer },
  error: { bg: colors.errorContainer, fg: colors.onErrorContainer },
  info: { bg: colors.infoContainer, fg: colors.onInfoContainer },
  neutral: { bg: colors.fill3, fg: colors.secondaryLabel },
};
/** Estado da van/aluno/pagamento — sempre texto + cor. `live` pulsa o ponto (respeita Reduzir movimento). */
export const StatusPill: React.FC<{ tone: PillTone; label: string; icon?: IconName; live?: boolean }> = ({ tone, label, icon, live }) => {
  const p = PILL[tone];
  const pulse = usePulse(!!live);
  return (
    <View style={[pl.box, { backgroundColor: p.bg }]} accessible accessibilityLabel={label}>
      {icon ? <Icon name={icon} size={13} color={p.fg} weight="semibold" /> : (
        <Animated.View style={[pl.dot, { backgroundColor: p.fg }, live && { opacity: pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.35, 1] }) }]} />
      )}
      <Text style={[pl.text, { color: p.fg }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{label}</Text>
    </View>
  );
};
const pl = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: spacing.s6, minHeight: 26, paddingLeft: spacing.sm, paddingRight: spacing.md, borderRadius: radius.full, alignSelf: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  text: { fontSize: 13, lineHeight: 16, fontWeight: '600' },
});

/* ------------------------------------------------------------------ Notice (banner) */
export const Notice: React.FC<{ tone: 'error' | 'info' | 'warning' | 'success' | 'signal'; message: string; icon?: IconName }> = ({ tone, message, icon }) => {
  const m = {
    error: { bg: colors.errorContainer, fg: colors.onErrorContainer, icon: 'alert' as IconName },
    info: { bg: colors.infoContainer, fg: colors.onInfoContainer, icon: 'info' as IconName },
    warning: { bg: colors.warningContainer, fg: colors.onWarningContainer, icon: 'warning' as IconName },
    success: { bg: colors.successContainer, fg: colors.onSuccessContainer, icon: 'checkCircle' as IconName },
    signal: { bg: colors.signalContainer, fg: colors.onSignalContainer, icon: 'van' as IconName },
  }[tone];
  return (
    <View style={[nt.box, { backgroundColor: m.bg }]} accessibilityRole="alert">
      <Icon name={icon ?? m.icon} size={18} color={m.fg} />
      <Text style={[nt.text, { color: m.fg }]}>{message}</Text>
    </View>
  );
};
const nt = StyleSheet.create({
  box: { flexDirection: 'row', gap: spacing.sm + 2, padding: spacing.md, borderRadius: radius.md, borderCurve: 'continuous', alignItems: 'flex-start' },
  text: { flex: 1, ...type.footnote, fontWeight: '500' },
});

/* ------------------------------------------------------------------ Empty state */
export const EmptyState: React.FC<{ icon: IconName; title: string; message: string; action?: React.ReactNode }> = ({ icon, title, message, action }) => (
  <View style={es.wrap}>
    <View style={es.icon}><Icon name={icon} size={30} color={colors.secondaryLabel} /></View>
    <Text style={es.title} accessibilityRole="header">{title}</Text>
    <Text style={es.msg}>{message}</Text>
    {action ? <View style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}>{action}</View> : null}
  </View>
);
const es = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xxxl + 4, paddingHorizontal: spacing.xxl },
  icon: { width: 64, height: 64, borderRadius: radius.full, backgroundColor: colors.fill3, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md + 2 },
  title: { ...type.title3, color: colors.label, textAlign: 'center' },
  msg: { ...type.subheadline, color: colors.secondaryLabel, textAlign: 'center', marginTop: spacing.xs },
});

/* ------------------------------------------------------------------ Skeleton */
export const Skeleton: React.FC<{ height?: number; style?: StyleProp<ViewStyle> }> = ({ height = 72, style }) => {
  const p = usePulse(true, 1400);
  return <Animated.View style={[{ height, borderRadius: radius.lg, backgroundColor: colors.fill3, opacity: p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.5, 1] }) }, style]} />;
};

/* ------------------------------------------------------------------ Stat */
export const Stat: React.FC<{ label: string; value: string; tone?: 'default' | 'signal' | 'success' }> = ({ label, value, tone = 'default' }) => (
  <View style={{ flex: 1 }} accessible accessibilityLabel={`${label}: ${value}`}>
    <Text style={{ ...type.footnote, color: colors.secondaryLabel }}>{label}</Text>
    <Text style={{ ...type.title2, fontVariant: ['tabular-nums'], marginTop: 2, color: tone === 'signal' ? colors.signalInk : tone === 'success' ? colors.success : colors.label }}
      numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
  </View>
);

/* ------------------------------------------------------------------ Map markers */
/** A única forma amarela do mapa. `live` = halo pulsante (transmitindo GPS). */
export const VanMarker: React.FC<{ live?: boolean }> = ({ live = true }) => {
  const pulse = usePulse(live, 2000);
  return (
    <View style={mk.wrap} accessible accessibilityLabel={live ? 'Van, ao vivo' : 'Van parada'}>
      {live ? (
        <Animated.View style={[mk.halo, {
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.4] }) }],
        }]} />
      ) : null}
      <View style={[mk.van, !live && { backgroundColor: colors.fill1 }]}>
        <Icon name="van" size={20} color={live ? colors.onSignal : colors.label} />
      </View>
    </View>
  );
};
export const StopMarker: React.FC<{ kind?: 'stop' | 'home' | 'school'; done?: boolean; label?: string }> = ({ kind = 'stop', done, label }) => {
  if (kind === 'stop') return <View style={[mk.stop, { borderColor: done ? colors.routeDone : colors.route }]} accessibilityLabel={label} />;
  return (
    <View style={mk.home} accessibilityLabel={label}>
      <Icon name={kind === 'home' ? 'homeFill' : 'school'} size={15} color={colors.onPrimary} />
    </View>
  );
};
const mk = StyleSheet.create({
  wrap: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 72, height: 72, borderRadius: radius.full, backgroundColor: colors.signal },
  van: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.white, boxShadow: '0 6px 16px rgba(0,0,0,0.25)' },
  stop: { width: 16, height: 16, borderRadius: radius.full, backgroundColor: colors.systemBg, borderWidth: 4 },
  home: { width: 30, height: 30, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.systemBg },
});

/* ------------------------------------------------------------------ Route timeline */
export type StopState = 'done' | 'now' | 'next' | 'future';
export const RouteTimeline: React.FC<{ stops: { label: string; time: string; state: StopState }[] }> = ({ stops }) => (
  <View accessibilityRole="list">
    {stops.map((s, i) => {
      const last = i === stops.length - 1;
      const railDone = s.state === 'done';
      return (
        <View key={`${s.label}-${i}`} style={tl.item} accessible accessibilityLabel={`${s.label}, ${s.time}${s.state === 'now' ? ', agora' : ''}`}>
          <View style={tl.rail}>
            {!last ? <View style={[tl.line, { backgroundColor: railDone ? colors.route : colors.routeDone }]} /> : null}
            <View style={[tl.dot,
              s.state === 'done' && { backgroundColor: colors.route },
              s.state === 'now' && tl.now,
              s.state === 'next' && { backgroundColor: colors.systemBg, borderWidth: 3, borderColor: colors.route },
            ]} />
          </View>
          <View style={[tl.body, !last && { paddingBottom: spacing.lg }]}>
            <Text style={[tl.title, s.state === 'done' && { color: colors.secondaryLabel }, (s.state === 'now' || s.state === 'next') && { fontWeight: '600' }]}>{s.label}</Text>
            <Text style={tl.time}>{s.time}</Text>
          </View>
        </View>
      );
    })}
  </View>
);
const tl = StyleSheet.create({
  item: { flexDirection: 'row', gap: spacing.md },
  rail: { width: 16, alignItems: 'center' },
  line: { position: 'absolute', top: 18, bottom: -2, width: 2, borderRadius: 1 },
  dot: { width: 12, height: 12, marginTop: 4, borderRadius: radius.full, backgroundColor: colors.routeDone },
  now: { width: 16, height: 16, marginTop: 2, backgroundColor: colors.signal, borderWidth: 3, borderColor: colors.signalContainer },
  body: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  title: { flex: 1, ...type.subheadline, color: colors.label },
  time: { ...type.subheadline, color: colors.secondaryLabel, fontVariant: ['tabular-nums'] },
});

/* ------------------------------------------------------------------ Message bubble */
/** Chat estilo iMessage: enviadas em tinta, recebidas em preenchimento neutro, avisos do sistema em signal-container. */
export const MessageBubble: React.FC<{ kind: 'in' | 'out' | 'system'; text: string; sender?: string; meta?: string }> = ({ kind, text, sender, meta }) => {
  if (kind === 'system') {
    return <View style={mb.system}><Text style={mb.systemText}>{text}</Text></View>;
  }
  const out = kind === 'out';
  return (
    <View style={{ alignItems: out ? 'flex-end' : 'flex-start' }} accessible accessibilityLabel={`${sender ? sender + ': ' : ''}${text}${meta ? ', ' + meta : ''}`}>
      <View style={[mb.bubble, out ? mb.out : mb.in]}>
        {sender && !out ? <Text style={mb.sender}>{sender}</Text> : null}
        <Text selectable style={[mb.text, { color: out ? colors.onPrimary : colors.label }]}>{text}</Text>
      </View>
      {meta ? <Text style={mb.meta}>{meta}</Text> : null}
    </View>
  );
};
const mb = StyleSheet.create({
  bubble: { maxWidth: '78%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 18, borderCurve: 'continuous' },
  out: { backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  in: { backgroundColor: colors.fill3, borderBottomLeftRadius: 6 },
  sender: { ...type.caption1, fontWeight: '600', color: colors.secondaryLabel, marginBottom: 2 },
  text: { ...type.body },
  meta: { ...type.caption2, color: colors.secondaryLabel, marginTop: 3, marginHorizontal: spacing.md },
  system: { alignSelf: 'center', maxWidth: '90%', backgroundColor: colors.signalContainer, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  systemText: { ...type.footnote, color: colors.onSignalContainer, textAlign: 'center' },
});
