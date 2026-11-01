import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { motion, radius, shadows, spacing } from '../../theme/tokens';
import { type } from '../../theme/type';
import { TouchableScale } from './TouchableScale';

type IconName = keyof typeof Ionicons.glyphMap;

/* ---------- Card & grupos ---------- */
export const Card: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }> = ({
  children, style, padded = true,
}) => <View style={[kit.card, padded && { padding: spacing.lg + 2 }, style]}>{children}</View>;

export const SectionLabel: React.FC<{ children: string; right?: React.ReactNode }> = ({ children, right }) => (
  <View style={kit.sectionRow}>
    <Text style={kit.sectionLabel} accessibilityRole="header">{children}</Text>
    {right}
  </View>
);

/** Lista agrupada (inset grouped): linhas separadas por divisores. */
export const Group: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[kit.card, { overflow: 'hidden' }]}>
      {items.map((c, i) => (
        <View key={i}>
          {c}
          {i < items.length - 1 && <View style={kit.divider} />}
        </View>
      ))}
    </View>
  );
};

export const IconTile: React.FC<{ name: IconName; color?: string; bg?: string; size?: number }> = ({
  name, color = colors.textPrimary, bg = colors.background, size = 38,
}) => (
  <View style={{ width: size, height: size, borderRadius: size * 0.34, borderCurve: 'continuous', backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
    <Ionicons name={name} size={size * 0.5} color={color} />
  </View>
);

export const Row: React.FC<{
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  iconBg?: string;
  value?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  chevron?: boolean;
  destructive?: boolean;
  onPress?: () => void;
}> = ({ title, subtitle, icon, iconColor, iconBg, value, left, right, chevron, destructive, onPress }) => {
  const content = (
    <View style={kit.row}>
      {left ?? (icon ? <IconTile name={icon} color={destructive ? colors.systemRed : iconColor} bg={destructive ? colors.systemRedLight : iconBg} /> : null)}
      <View style={{ flex: 1 }}>
        <Text style={[kit.rowTitle, destructive && { color: colors.systemRed }]} numberOfLines={2}>{title}</Text>
        {subtitle ? <Text style={kit.rowSub} numberOfLines={3}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={kit.rowValue}>{value}</Text> : null}
      {right}
      {(chevron ?? !!onPress) && !right ? <Ionicons name="chevron-forward" size={16} color={colors.textQuaternary} /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <TouchableScale onPress={onPress} pressedScale={0.985} accessibilityRole="button" accessibilityLabel={title}>
      {content}
    </TouchableScale>
  );
};

/* ---------- Badge / Avatar / Chip ---------- */
export const Badge: React.FC<{ label: string; color: string; bg: string; icon?: IconName }> = ({ label, color, bg, icon }) => (
  <View style={[kit.badge, { backgroundColor: bg }]}>
    {icon ? <Ionicons name={icon} size={12} color={color} /> : null}
    <Text style={[kit.badgeText, { color }]}>{label}</Text>
  </View>
);

const AVATAR_COLORS = ['#FEF3C7', '#E5F1FF', '#EBF9F0', '#F7EEFC', '#FEECEB'];
const AVATAR_TEXT = ['#92400E', '#0051A8', '#1E7E34', '#7A2FA6', '#C41C15'];
export const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 44 }) => {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  const k = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: AVATAR_COLORS[k], alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.36, fontWeight: '700', color: AVATAR_TEXT[k] }}>{initials}</Text>
    </View>
  );
};

export const Chip: React.FC<{ label: string; selected?: boolean; onPress: () => void; icon?: IconName }> = ({ label, selected, onPress, icon }) => (
  <TouchableScale
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected }}
    style={[kit.chip, selected && kit.chipOn]}
  >
    {icon ? <Ionicons name={icon} size={14} color={selected ? '#fff' : colors.textSecondary} /> : null}
    <Text style={[kit.chipText, selected && { color: '#fff' }]}>{label}</Text>
  </TouchableScale>
);

/* ---------- Segmented (thumb animado) ---------- */
export function Segmented<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string; badge?: number }[]; value: T; onChange: (v: T) => void }) {
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const slot = w ? (w - 6) / options.length : 0;
  useEffect(() => {
    if (slot) Animated.spring(x, { toValue: idx * slot, useNativeDriver: true, ...motion.spring.snappy }).start();
  }, [idx, slot, x]);
  return (
    <View style={kit.seg} onLayout={(e) => setW(e.nativeEvent.layout.width)} accessibilityRole="tablist">
      {slot > 0 && <Animated.View style={[kit.segThumb, { width: slot, transform: [{ translateX: x }] }]} />}
      {options.map((o) => (
        <TouchableScale
          key={o.value}
          onPress={() => onChange(o.value)}
          style={kit.segItem}
          pressedScale={0.97}
          accessibilityRole="tab"
          accessibilityState={{ selected: o.value === value }}
        >
          <Text style={[kit.segText, o.value === value && { color: colors.textPrimary, fontWeight: '700' }]}>{o.label}</Text>
          {o.badge ? (
            <View style={kit.segBadge}><Text style={kit.segBadgeText}>{o.badge > 9 ? '9+' : o.badge}</Text></View>
          ) : null}
        </TouchableScale>
      ))}
    </View>
  );
}

/* ---------- Campo de formulário ---------- */
export const Field: React.FC<TextInputProps & { label: string; error?: string | null; hint?: string; icon?: IconName; inputRef?: React.Ref<any> }> =
  ({ label, error, hint, icon, secureTextEntry, style, inputRef, ...rest }) => {
    const [focus, setFocus] = useState(false);
    const [hidden, setHidden] = useState(!!secureTextEntry);
    return (
      <View style={{ gap: 6 }}>
        <Text style={kit.fieldLabel}>{label}</Text>
        <View style={[kit.fieldBox, focus && kit.fieldFocus, !!error && kit.fieldError]}>
          {icon ? <Ionicons name={icon} size={18} color={colors.textTertiary} /> : null}
          <TextInput
            ref={inputRef}
            {...rest}
            secureTextEntry={hidden}
            placeholderTextColor={colors.textQuaternary}
            onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
            onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
            style={[kit.fieldInput, style]}
            accessibilityLabel={label}
          />
          {secureTextEntry ? (
            <TouchableScale onPress={() => setHidden((h) => !h)} accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'} hitSlop={10}>
              <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textTertiary} />
            </TouchableScale>
          ) : null}
        </View>
        {error ? <Text style={kit.fieldErrorText} accessibilityLiveRegion="polite">{error}</Text> : hint ? <Text style={kit.fieldHint}>{hint}</Text> : null}
      </View>
    );
  };

/* ---------- Estados ---------- */
export const EmptyState: React.FC<{
  icon: IconName; title: string; message: string; action?: React.ReactNode;
}> = ({ icon, title, message, action }) => (
  <View style={kit.empty}>
    <View style={kit.emptyIcon}><Ionicons name={icon} size={30} color={colors.textTertiary} /></View>
    <Text style={kit.emptyTitle}>{title}</Text>
    <Text style={kit.emptyMsg}>{message}</Text>
    {action ? <View style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}>{action}</View> : null}
  </View>
);

export const Banner: React.FC<{ tone: 'error' | 'info' | 'warning' | 'success'; message: string; icon?: IconName }> = ({ tone, message, icon }) => {
  const m = {
    error: { bg: colors.systemRedLight, fg: colors.systemRedText, icon: 'alert-circle' as IconName },
    info: { bg: colors.systemBlueLight, fg: colors.systemBlueText, icon: 'information-circle' as IconName },
    warning: { bg: colors.systemOrangeLight, fg: '#9A3412', icon: 'warning' as IconName },
    success: { bg: colors.systemGreenLight, fg: colors.systemGreenText, icon: 'checkmark-circle' as IconName },
  }[tone];
  return (
    <View style={[kit.banner, { backgroundColor: m.bg }]} accessibilityRole="alert">
      <Ionicons name={icon ?? m.icon} size={18} color={m.fg} />
      <Text style={[kit.bannerText, { color: m.fg }]}>{message}</Text>
    </View>
  );
};

export const Skeleton: React.FC<{ height?: number; style?: StyleProp<ViewStyle> }> = ({ height = 72, style }) => {
  const o = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(o, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(o, { toValue: 0.5, duration: 700, useNativeDriver: true }),
    ]));
    l.start();
    return () => l.stop();
  }, [o]);
  return <Animated.View style={[{ height, borderRadius: radius.lg, backgroundColor: colors.border, opacity: o }, style]} />;
};

export const Stat: React.FC<{ label: string; value: string; tone?: string }> = ({ label, value, tone }) => (
  <View style={{ flex: 1 }}>
    <Text style={kit.statLabel}>{label}</Text>
    <Text style={[kit.statValue, tone ? { color: tone } : null]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
  </View>
);

export const kit = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl, borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...shadows.card,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 8, marginTop: 6 },
  sectionLabel: { ...type.caption, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.7 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 66 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, minHeight: 56 },
  rowTitle: { ...type.callout, fontWeight: '600', color: colors.textPrimary },
  rowSub: { ...type.footnote, color: colors.textTertiary, marginTop: 1 },
  rowValue: { ...type.subhead, color: colors.textTertiary },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: -0.1 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, minHeight: 40,
    borderRadius: radius.pill, backgroundColor: colors.background, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { ...type.subhead, fontWeight: '600', color: colors.textSecondary },
  seg: { flexDirection: 'row', backgroundColor: '#E9E9EE', borderRadius: radius.md, padding: 3 },
  segThumb: {
    position: 'absolute', top: 3, bottom: 3, left: 3, borderRadius: radius.md - 3, backgroundColor: '#fff',
    ...shadows.card,
  },
  segItem: { flex: 1, paddingVertical: 9, minHeight: 40, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  segText: { ...type.subhead, fontWeight: '500', color: colors.textSecondary },
  segBadge: { backgroundColor: colors.systemRed, borderRadius: 8, minWidth: 16, height: 16, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  segBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  fieldLabel: { ...type.footnote, fontWeight: '600', color: colors.textSecondary, marginLeft: 2 },
  fieldBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: radius.md,
    borderCurve: 'continuous', borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, minHeight: 52,
  },
  fieldFocus: { borderColor: colors.ink },
  fieldError: { borderColor: colors.systemRed },
  fieldInput: { flex: 1, ...type.body, color: colors.textPrimary, paddingVertical: 12 },
  fieldErrorText: { ...type.footnote, color: colors.systemRedText, marginLeft: 2 },
  fieldHint: { ...type.footnote, color: colors.textTertiary, marginLeft: 2 },
  empty: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 14, ...shadows.card },
  emptyTitle: { ...type.headline, color: colors.textPrimary, textAlign: 'center' },
  emptyMsg: { ...type.subhead, color: colors.textTertiary, textAlign: 'center', marginTop: 4 },
  banner: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.md, alignItems: 'flex-start' },
  bannerText: { flex: 1, ...type.footnote, fontWeight: '500' },
  statLabel: { ...type.caption, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { ...type.title3, color: colors.textPrimary, marginTop: 2 },
});

export type StatusAluno = 'AGUARDANDO' | 'EMBARCADO' | 'DESEMBARCADO' | 'AUSENTE';
export function statusAluno(s: StatusAluno): { label: string; color: string; bg: string; icon: IconName } {
  switch (s) {
    case 'EMBARCADO': return { label: 'A bordo', color: colors.systemGreenText, bg: colors.systemGreenLight, icon: 'checkmark-circle' };
    case 'DESEMBARCADO': return { label: 'Na escola', color: colors.systemBlueText, bg: colors.systemBlueLight, icon: 'school' };
    case 'AUSENTE': return { label: 'Faltou', color: colors.systemRedText, bg: colors.systemRedLight, icon: 'close-circle' };
    default: return { label: 'Aguardando', color: colors.textSecondary, bg: colors.background, icon: 'time' };
  }
}

export const ProgressBar: React.FC<{ value: number; total: number; color?: string }> = ({ value, total, color = colors.ink }) => {
  const w = useRef(new Animated.Value(0)).current;
  const pct = total > 0 ? value / total : 0;
  useEffect(() => {
    Animated.timing(w, { toValue: pct, duration: 500, easing: motion.easing, useNativeDriver: false }).start();
  }, [pct, w]);
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.background, overflow: 'hidden' }}
      accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: value }}>
      <Animated.View style={{ height: 8, borderRadius: 4, backgroundColor: color, width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
    </View>
  );
};
