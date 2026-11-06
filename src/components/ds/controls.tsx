/**
 * Controles HIG: segmented control, toggle, slider, stepper, progress, page control, disclosure group.
 * Todos funcionam igual no iOS e no Android (com feedback nativo de cada plataforma).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, PanResponder, Platform, Pressable, StyleSheet, Switch, Text, View,
} from 'react-native';
import { colors } from '../../theme/colors';
import { hitTarget, motion, radius, spacing } from '../../theme/tokens';
import { type } from '../../theme/type';
import { Icon } from './icon';
import { haptic } from './pressable';
import { ListRow, ListRowProps } from './list';

/* ------------------------------------------------------------------ Segmented control */
export interface SegmentOption<T extends string> { value: T; label: string; badge?: number }

/** 2–5 opções exclusivas da mesma natureza (PIX/Cartão/Boleto, Ida/Volta). Cápsula com polegar elevado. */
export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: {
  options: SegmentOption<T>[]; value: T; onChange: (v: T) => void; accessibilityLabel?: string;
}) {
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const slot = w ? (w - 4) / options.length : 0;
  useEffect(() => {
    if (slot) Animated.spring(x, { toValue: idx * slot, useNativeDriver: true, ...motion.spring.snappy }).start();
  }, [idx, slot, x]);
  return (
    <View style={sg.track} onLayout={(e) => setW(e.nativeEvent.layout.width)} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      {slot > 0 && <Animated.View pointerEvents="none" style={[sg.thumb, { width: slot, transform: [{ translateX: x }] }]} />}
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <Pressable key={o.value} style={sg.item} hitSlop={{ top: 6, bottom: 6 }}
            onPress={() => { if (!sel) { haptic.selection(); onChange(o.value); } }}
            accessibilityRole="tab" accessibilityState={{ selected: sel }} accessibilityLabel={o.badge ? `${o.label}, ${o.badge} novos` : o.label}>
            <Text style={[sg.text, sel && sg.textSel]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{o.label}</Text>
            {o.badge ? <View style={sg.badge}><Text style={sg.badgeText}>{o.badge > 9 ? '9+' : o.badge}</Text></View> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const sg = StyleSheet.create({
  track: { flexDirection: 'row', padding: 2, borderRadius: radius.full, backgroundColor: colors.fill3, minHeight: 36 },
  thumb: { position: 'absolute', top: 2, bottom: 2, left: 2, borderRadius: radius.full, backgroundColor: colors.tertiarySystemBg, boxShadow: '0 3px 8px rgba(0,0,0,0.12), 0 3px 1px rgba(0,0,0,0.04)' },
  item: { flex: 1, minHeight: 32, flexDirection: 'row', gap: spacing.s6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  text: { ...type.footnote, fontWeight: '500', color: colors.label },
  textSel: { fontWeight: '600' },
  badge: { minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: radius.full, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, fontWeight: '600', color: colors.onError, fontVariant: ['tabular-nums'] },
});

/* ------------------------------------------------------------------ Toggle */
/** Switch nativo (UISwitch / Material Switch). Ligado = verde do sistema (significa "ativo"). Use sempre dentro de uma linha rotulada. */
export const Toggle: React.FC<{ value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean; accessibilityLabel?: string }> = ({
  value, onValueChange, disabled, accessibilityLabel,
}) => (
  <Switch
    value={value}
    onValueChange={onValueChange}
    disabled={disabled}
    accessibilityLabel={accessibilityLabel}
    trackColor={{ false: colors.fill1, true: colors.success }}
    thumbColor={Platform.OS === 'android' ? colors.white : undefined}
    ios_backgroundColor={colors.fill1}
  />
);

/** Linha rotulada com toggle. */
export type ToggleRowProps = Omit<ListRowProps, 'trailing' | 'onPress' | 'value'> & { value: boolean; onValueChange: (v: boolean) => void };
export const ToggleRow: React.FC<ToggleRowProps> = ({ value, onValueChange, ...row }) => (
  <ListRow {...row} chevron={false} trailing={<Toggle value={value} onValueChange={onValueChange} disabled={row.disabled} accessibilityLabel={row.title} />} />
);

/* ------------------------------------------------------------------ Slider */
/** Valor contínuo (ex.: distância do alerta de aproximação). */
export const Slider: React.FC<{ value: number; min: number; max: number; step?: number; onChange: (v: number) => void; disabled?: boolean; accessibilityLabel: string }> = ({
  value, min, max, step, onChange, disabled, accessibilityLabel,
}) => {
  const [w, setW] = useState(0);
  const clamp = (v: number) => {
    const c = Math.min(max, Math.max(min, v));
    return step ? Math.round(c / step) * step : c;
  };
  const fromX = (px: number) => clamp(min + (px / Math.max(w, 1)) * (max - min));
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: (e) => onChangeRef.current(fromXRef.current(e.nativeEvent.locationX)),
    onPanResponderMove: (e) => onChangeRef.current(fromXRef.current(e.nativeEvent.locationX)),
  })).current;
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;
  const fromXRef = useRef(fromX); fromXRef.current = fromX;
  const pct = (value - min) / Math.max(max - min, 1e-6);
  return (
    <View
      style={[sl.wrap, disabled && { opacity: 0.38 }]}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      {...pan.panHandlers}
      accessible accessibilityRole="adjustable" accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(clamp(value + (e.nativeEvent.actionName === 'increment' ? 1 : -1) * (step ?? (max - min) / 10)))}
    >
      <View pointerEvents="none" style={sl.track} />
      <View pointerEvents="none" style={[sl.fill, { width: pct * w }]} />
      <View pointerEvents="none" style={[sl.thumb, { left: pct * w - 14 }]} />
    </View>
  );
};
const sl = StyleSheet.create({
  wrap: { height: hitTarget, justifyContent: 'center' },
  track: { height: 6, borderRadius: radius.full, backgroundColor: colors.fill1 },
  fill: { position: 'absolute', left: 0, height: 6, borderRadius: radius.full, backgroundColor: colors.primary },
  thumb: { position: 'absolute', width: 28, height: 28, borderRadius: radius.full, backgroundColor: colors.white, boxShadow: '0 0.5px 4px rgba(0,0,0,0.12), 0 6px 13px rgba(0,0,0,0.12)' },
});

/* ------------------------------------------------------------------ Stepper */
export const Stepper: React.FC<{ value: number; min: number; max: number; step?: number; onChange: (v: number) => void; accessibilityLabel: string }> = ({
  value, min, max, step = 1, onChange, accessibilityLabel,
}) => {
  const btn = (dir: -1 | 1) => {
    const off = dir < 0 ? value <= min : value >= max;
    return (
      <Pressable disabled={off} onPress={() => { haptic.selection(); onChange(Math.min(max, Math.max(min, value + dir * step))); }}
        style={st.btn} hitSlop={{ top: 6, bottom: 6 }} accessibilityRole="button" accessibilityLabel={`${dir < 0 ? 'Diminuir' : 'Aumentar'} ${accessibilityLabel}`}>
        <Icon name={dir < 0 ? 'minus' : 'plus'} size={15} color={off ? colors.quaternaryLabel : colors.label} weight="semibold" />
      </Pressable>
    );
  };
  return <View style={st.box} accessibilityLabel={`${accessibilityLabel}: ${value}`}>{btn(-1)}<View style={st.div} />{btn(1)}</View>;
};
const st = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', height: 32, borderRadius: radius.sm, borderCurve: 'continuous', backgroundColor: colors.fill3 },
  btn: { width: 47, height: 32, alignItems: 'center', justifyContent: 'center' },
  div: { width: StyleSheet.hairlineWidth, height: 18, backgroundColor: colors.separator },
});

/* ------------------------------------------------------------------ Progress */
/** Barra determinada: tom `signal` para progresso da rota; `default` (tinta) para envios. */
export const ProgressBar: React.FC<{ value: number; total?: number; tone?: 'default' | 'signal' | 'success'; accessibilityLabel?: string }> = ({
  value, total = 1, tone = 'default', accessibilityLabel,
}) => {
  const w = useRef(new Animated.Value(0)).current;
  const pct = total > 0 ? Math.min(1, value / total) : 0;
  useEffect(() => {
    Animated.timing(w, { toValue: pct, duration: 500, easing: motion.easing, useNativeDriver: false }).start();
  }, [pct, w]);
  const color = tone === 'signal' ? colors.signal : tone === 'success' ? colors.success : colors.primary;
  return (
    <View style={pg.track} accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel} accessibilityValue={{ min: 0, max: total, now: value }}>
      <Animated.View style={[pg.fill, { backgroundColor: color, width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
    </View>
  );
};
/** Indicador de atividade nativo (spinner iOS / circular Material). */
export const Spinner: React.FC<{ size?: 'small' | 'large'; label?: string }> = ({ size = 'small', label }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }} accessibilityLabel={label} accessibilityLiveRegion="polite">
    <ActivityIndicator size={size} color={colors.secondaryLabel} />
    {label ? <Text style={{ ...type.footnote, color: colors.secondaryLabel }}>{label}</Text> : null}
  </View>
);
const pg = StyleSheet.create({
  track: { height: 4, borderRadius: radius.full, backgroundColor: colors.fill1, overflow: 'hidden' },
  fill: { height: 4, borderRadius: radius.full },
});

/* ------------------------------------------------------------------ Page control */
export const PageControl: React.FC<{ count: number; index: number; onGlass?: boolean }> = ({ count, index, onGlass }) => (
  <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' }}
    accessibilityRole="adjustable" accessibilityLabel={`Página ${index + 1} de ${count}`}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={{
        width: i === index ? 18 : 7, height: 7, borderRadius: radius.full,
        backgroundColor: i === index ? (onGlass ? colors.white : colors.label) : (onGlass ? 'rgba(255,255,255,0.5)' : colors.fill1),
      }} />
    ))}
  </View>
);

/* ------------------------------------------------------------------ Disclosure group */
export const DisclosureGroup: React.FC<{ title: string; subtitle?: string; expanded?: boolean; onToggle?: (open: boolean) => void; children: React.ReactNode; showSeparator?: boolean }> = ({
  title, subtitle, expanded, onToggle, children, showSeparator,
}) => {
  const [inner, setInner] = useState(!!expanded);
  const open = expanded ?? inner;
  const rot = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(rot, { toValue: open ? 1 : 0, duration: motion.duration.base, easing: motion.easing, useNativeDriver: true }).start();
  }, [open, rot]);
  const toggle = () => { const n = !open; setInner(n); onToggle?.(n); };
  return (
    <View>
      <ListRow title={title} subtitle={subtitle} showSeparator={showSeparator} chevron={false} onPress={toggle}
        accessibilityLabel={`${title}, ${open ? 'expandido' : 'recolhido'}`}
        trailing={<Animated.View style={{ transform: [{ rotate: rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) }] }}>
          <Icon name="chevronRight" size={14} color={colors.tertiaryLabel} weight="semibold" />
        </Animated.View>} />
      {open ? <View style={{ paddingLeft: 18 }}>{React.Children.map(children, (c) => React.isValidElement(c) ? React.cloneElement(c as React.ReactElement<ListRowProps>, { showSeparator: true }) : c)}</View> : null}
    </View>
  );
};
