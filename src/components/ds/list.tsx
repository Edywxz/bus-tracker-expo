import React from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { elevation, layout, radius, spacing } from '../../theme/tokens';
import { type } from '../../theme/type';
import { Icon, IconName } from './icon';
import { PressableScale } from './pressable';

export type ListStyle = 'plain' | 'grouped' | 'insetGrouped';
export type IconTone = 'primary' | 'signal' | 'success' | 'warning' | 'error' | 'info' | 'gray';

const TONE: Record<IconTone, { bg: string; fg: string }> = {
  primary: { bg: colors.primary, fg: colors.onPrimary },
  signal: { bg: colors.signal, fg: colors.onSignal },
  success: { bg: colors.success, fg: colors.onSuccess },
  warning: { bg: colors.warning, fg: colors.onWarning },
  error: { bg: colors.error, fg: colors.onError },
  info: { bg: colors.info, fg: colors.onInfo },
  gray: { bg: colors.fill3, fg: colors.label },
};

/** Ícone em quadrado arredondado de 30pt (padrão Ajustes do iOS). */
export const IconTile: React.FC<{ name: IconName; tone?: IconTone; size?: number }> = ({ name, tone = 'gray', size = 30 }) => (
  <View style={{ width: size, height: size, borderRadius: size > 30 ? radius.md : radius.sm, borderCurve: 'continuous', backgroundColor: TONE[tone].bg, alignItems: 'center', justifyContent: 'center' }}>
    <Icon name={name} size={Math.round(size * 0.58)} color={TONE[tone].fg} weight="medium" />
  </View>
);

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Ícone em tile 30pt à esquerda. */
  icon?: IconName;
  iconTone?: IconTone;
  /** Elemento à esquerda (ex.: Avatar). Tem prioridade sobre `icon`. */
  leading?: React.ReactNode;
  /** Valor em texto secundário à direita. */
  value?: string;
  /** Elemento à direita (pill, toggle, botão). */
  trailing?: React.ReactNode;
  /** default: chevron quando há onPress e não há trailing. */
  chevron?: boolean;
  role?: 'default' | 'action' | 'destructive';
  disabled?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
  /** Injetado por ListSection. */
  showSeparator?: boolean;
  /** Linhas máximas do subtítulo (default 3). */
  subtitleLines?: number;
}

/** Linha de lista HIG: leading + título/subtítulo + trailing. Separador recuado alinhado ao texto. */
export const ListRow: React.FC<ListRowProps> = ({
  title, subtitle, icon, iconTone, leading, value, trailing, chevron, role = 'default', disabled, onPress, onLongPress,
  accessibilityLabel, showSeparator, subtitleLines = 3,
}) => {
  const lead = leading ?? (icon ? <IconTile name={icon} tone={role === 'destructive' ? 'error' : iconTone} /> : null);
  const sepInset = layout.rowInset + (leading ? 52 : icon ? 42 : 0);
  const showChevron = chevron ?? (!!onPress && !trailing);
  const titleColor = role === 'destructive' ? colors.error : role === 'action' ? colors.primaryInk : colors.label;
  const body = (
    <View style={[s.row, disabled && { opacity: 0.38 }]}>
      {showSeparator ? <View style={[s.sep, { left: sepInset }]} /> : null}
      {lead}
      <View style={s.body}>
        <Text style={[s.title, { color: titleColor }, role === 'action' && { fontWeight: '600' }]} numberOfLines={2}>{title}</Text>
        {subtitle ? <Text style={s.sub} numberOfLines={subtitleLines}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={s.value} numberOfLines={1} selectable>{value}</Text> : null}
      {trailing}
      {showChevron ? <Icon name="chevronRight" size={14} color={colors.tertiaryLabel} weight="semibold" /> : null}
    </View>
  );
  if (!onPress && !onLongPress) return <View accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel}>{body}</View>;
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} disabled={disabled}
      android_ripple={{ color: colors.fill2 }}
      accessibilityRole="button" accessibilityState={{ disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel ?? [title, subtitle, value].filter(Boolean).join(', ')}
      style={({ pressed }) => (pressed && Platform.OS === 'ios' ? { backgroundColor: colors.fill4 } : null)}>
      {body}
    </Pressable>
  );
};

/** Container de linhas: plain · grouped · insetGrouped (default). Insere separadores entre as linhas. */
export const ListSection: React.FC<{ children: React.ReactNode; listStyle?: ListStyle; style?: StyleProp<ViewStyle> }> = ({
  children, listStyle = 'insetGrouped', style,
}) => {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[s.base, listStyle === 'insetGrouped' && s.inset, listStyle === 'grouped' && s.grouped, listStyle === 'plain' && s.plain, style]}>
      {items.map((c, i) =>
        React.isValidElement(c) ? React.cloneElement(c as React.ReactElement<ListRowProps>, { showSeparator: i > 0 }) : c)}
    </View>
  );
};

const s = StyleSheet.create({
  base: { backgroundColor: colors.secondaryGroupedBg, overflow: 'hidden' },
  inset: { borderRadius: radius.lg, borderCurve: 'continuous' },
  grouped: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.separator },
  plain: { backgroundColor: colors.systemBg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: layout.rowMin, paddingVertical: 11, paddingLeft: layout.rowInset, paddingRight: spacing.lg },
  sep: { position: 'absolute', top: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
  body: { flex: 1, gap: 2 },
  title: { ...type.body },
  sub: { ...type.subheadline, color: colors.secondaryLabel },
  value: { ...type.body, color: colors.secondaryLabel, maxWidth: '55%', textAlign: 'right' },
});

/* ------------------------------------------------------------------ Section header / footer */
export const SectionHeader: React.FC<{ title: string; variant?: 'default' | 'prominent'; action?: { label: string; onPress: () => void } }> = ({
  title, variant = 'default', action,
}) => (
  <View style={[h.row, variant === 'prominent' && { paddingLeft: 0 }]}>
    <Text style={variant === 'prominent' ? h.prominent : h.title} accessibilityRole="header">{title}</Text>
    {action ? (
      <PressableScale onPress={action.onPress} hitSlop={12} accessibilityRole="button" accessibilityLabel={action.label}>
        <Text style={h.action}>{action.label}</Text>
      </PressableScale>
    ) : null}
  </View>
);

export const SectionFooter: React.FC<{ children: string }> = ({ children }) => <Text style={h.footer}>{children}</Text>;

const h = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: layout.rowInset, paddingRight: spacing.xs, paddingTop: spacing.lg, paddingBottom: spacing.s6 },
  title: { ...type.sectionHeader, color: colors.secondaryLabel },
  prominent: { ...type.title3, fontWeight: '700', color: colors.label },
  action: { ...type.subheadline, color: colors.primaryInk, fontWeight: '600' },
  footer: { ...type.footnote, color: colors.secondaryLabel, paddingHorizontal: layout.rowInset, paddingTop: spacing.s6 },
});

/* ------------------------------------------------------------------ Card */
export const Card: React.FC<{ children: React.ReactNode; variant?: 'default' | 'signal'; padded?: boolean; style?: StyleProp<ViewStyle>; onPress?: () => void; accessibilityLabel?: string }> = ({
  children, variant = 'default', padded = true, style, onPress, accessibilityLabel,
}) => {
  const box: StyleProp<ViewStyle> = [
    { borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: variant === 'signal' ? colors.signalContainer : colors.secondaryGroupedBg },
    variant === 'default' ? elevation.e1 : null,
    padded && { padding: spacing.lg },
    style,
  ];
  if (!onPress) return <View style={box}>{children}</View>;
  return <PressableScale onPress={onPress} pressedScale={0.985} style={box} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>{children}</PressableScale>;
};
