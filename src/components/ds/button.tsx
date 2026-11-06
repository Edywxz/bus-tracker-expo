import React from 'react';
import { ActivityIndicator, Platform, StyleProp, Text, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { hitTarget, radius, spacing } from '../../theme/tokens';
import { type } from '../../theme/type';
import { GlassSurface } from './glass';
import { Icon, IconName } from './icon';
import { haptic, PressableScale } from './pressable';

export type ButtonVariant = 'plain' | 'gray' | 'tinted' | 'bordered' | 'borderedProminent' | 'filled' | 'glass' | 'glassProminent';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  /** default `borderedProminent` — a ação principal da tela. */
  variant?: ButtonVariant;
  role?: 'default' | 'destructive';
  size?: ButtonSize;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

const HEIGHT: Record<ButtonSize, number> = { sm: 30, md: Math.max(44, hitTarget), lg: 50 };
const PAD: Record<ButtonSize, number> = { sm: spacing.md, md: spacing.lg, lg: spacing.xxl };
const FONT: Record<ButtonSize, number> = { sm: 15, md: 17, lg: 17 };

function palette(variant: ButtonVariant, destructive: boolean) {
  const d = destructive;
  switch (variant) {
    case 'plain': return { bg: 'transparent', fg: d ? colors.error : colors.primaryInk, border: undefined };
    case 'gray': return { bg: colors.fill3, fg: d ? colors.error : colors.label, border: undefined };
    case 'tinted': return d
      ? { bg: colors.errorContainer, fg: colors.onErrorContainer, border: undefined }
      : { bg: colors.primaryContainer, fg: colors.onPrimaryContainer, border: undefined };
    case 'bordered': return { bg: colors.secondaryGroupedBg, fg: d ? colors.error : colors.label, border: colors.opaqueSeparator };
    case 'glass': return { bg: 'transparent', fg: d ? colors.error : colors.label, border: undefined };
    case 'glassProminent': return { bg: 'transparent', fg: colors.onPrimary, border: undefined };
    case 'filled':
    case 'borderedProminent':
    default: return d
      ? { bg: colors.error, fg: colors.onError, border: undefined }
      : { bg: colors.primary, fg: colors.onPrimary, border: undefined };
  }
}

/**
 * Botão HIG com uma só família de ação (tinta).
 * plain · gray · tinted · bordered · borderedProminent (ação principal) · filled (CTA largo de rodapé)
 * · glass / glassProminent (sobre o mapa). Papel destrutivo troca para vermelho.
 */
export const Button: React.FC<ButtonProps> = ({
  label, onPress, variant = 'borderedProminent', role = 'default', size = 'md', icon, disabled, loading, style, accessibilityHint,
}) => {
  const p = palette(variant, role === 'destructive');
  const h = variant === 'filled' ? 50 : HEIGHT[size];
  const r = variant === 'filled' ? radius.md : radius.full;
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.s6, minHeight: h, paddingHorizontal: variant === 'plain' ? spacing.sm : PAD[size] }}>
      {loading ? <ActivityIndicator size="small" color={p.fg} /> : icon ? <Icon name={icon} size={size === 'sm' ? 15 : 17} color={p.fg} weight="semibold" /> : null}
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.4}
        style={{ ...type.headline, fontSize: FONT[size], lineHeight: FONT[size] + 5, fontWeight: variant === 'plain' ? '400' : '600', color: p.fg, textAlign: 'center', flexShrink: 1 }}
      >
        {label}
      </Text>
    </View>
  );
  const press = () => { if (variant === 'borderedProminent' || variant === 'filled') haptic.light(); onPress(); };
  const a11y = {
    accessibilityRole: 'button' as const,
    accessibilityLabel: label,
    accessibilityHint,
    accessibilityState: { disabled: !!(disabled || loading), busy: !!loading },
  };

  if (variant === 'glass' || variant === 'glassProminent') {
    return (
      <PressableScale onPress={press} disabled={disabled || loading} style={style} {...a11y}>
        <GlassSurface material={variant === 'glassProminent' ? 'prominent' : 'regular'} interactive style={{ borderRadius: r }}>{content}</GlassSurface>
      </PressableScale>
    );
  }
  return (
    <PressableScale
      onPress={press}
      disabled={disabled || loading}
      style={[{ backgroundColor: p.bg, borderRadius: r, borderCurve: 'continuous', overflow: 'hidden' },
        p.border ? { borderWidth: 1, borderColor: p.border } : null,
        variant === 'filled' && Platform.OS === 'android' ? { borderRadius: radius.lg } : null,
        style]}
      {...a11y}
    >
      {content}
    </PressableScale>
  );
};

/** Botão só com ícone (círculo de 44pt). Para barras use `HeaderButton`. */
export const IconButton: React.FC<{ icon: IconName; label: string; onPress: () => void; variant?: 'gray' | 'glass' | 'plain'; size?: 'sm' | 'md'; disabled?: boolean; tint?: string }> = ({
  icon, label, onPress, variant = 'gray', size = 'md', disabled, tint,
}) => {
  const d = size === 'sm' ? 30 : hitTarget;
  const glyph = <Icon name={icon} size={size === 'sm' ? 15 : 20} color={tint ?? colors.label} weight="medium" />;
  const box = { width: d, height: d, borderRadius: radius.full, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <PressableScale onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} hitSlop={size === 'sm' ? 7 : 0}
      style={variant === 'glass' ? null : [box, { backgroundColor: variant === 'gray' ? colors.fill3 : 'transparent' }]}>
      {variant === 'glass' ? <GlassSurface interactive style={box}>{glyph}</GlassSurface> : glyph}
    </PressableScale>
  );
};
