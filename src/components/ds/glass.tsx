import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { colors } from '../../theme/colors';
import { elevation, fill } from '../../theme/tokens';

export type Material = 'ultraThin' | 'thin' | 'regular' | 'thick' | 'chrome' | 'prominent';

const glassAvailable = (() => {
  try { return Platform.OS === 'ios' && isGlassEffectAPIAvailable(); } catch { return false; }
})();

const BLUR_TINT = {
  ultraThin: 'systemUltraThinMaterial',
  thin: 'systemThinMaterial',
  regular: 'systemMaterial',
  thick: 'systemThickMaterial',
  chrome: 'systemChromeMaterial',
  prominent: 'systemThickMaterialDark',
} as const;

const SOLID = {
  ultraThin: colors.matUltraThin,
  thin: colors.matThin,
  regular: colors.matRegular,
  thick: colors.matThick,
  chrome: colors.matChrome,
  prominent: colors.glassTintProminent,
} as const;

interface Props {
  material?: Material;
  /** Vidro reage ao toque (botões, toolbar). */
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** Sombra flutuante (default true). */
  floating?: boolean;
}

/**
 * Superfície da camada de controle (barras, botões sobre o mapa, menus, sheets).
 * - iOS 26+: Liquid Glass nativo (expo-glass-effect).
 * - iOS < 26: material translúcido (expo-blur, tints system*Material).
 * - Android/web: superfície sólida tonal com elevação (Material) — legível sobre qualquer fundo.
 * Regras: nunca em linhas de lista ou cards; nunca vidro sobre vidro.
 */
export const GlassSurface: React.FC<Props> = ({ material = 'regular', interactive, style, children, floating = true }) => {
  const shadow = floating ? elevation.e2 : null;
  if (glassAvailable) {
    return (
      <GlassView
        glassEffectStyle="regular"
        isInteractive={interactive}
        tintColor={material === 'prominent' ? colors.primary : undefined}
        style={[{ overflow: 'hidden', borderCurve: 'continuous' }, style]}
      >
        {children}
      </GlassView>
    );
  }
  if (Platform.OS === 'ios') {
    const r = StyleSheet.flatten(style)?.borderRadius;
    return (
      <View style={[{ borderCurve: 'continuous' }, shadow, style]}>
        <BlurView
          tint={BLUR_TINT[material]}
          intensity={100}
          style={[fill, { borderRadius: r, overflow: 'hidden', borderCurve: 'continuous', borderWidth: 0.5, borderColor: colors.glassEdge }]}
        />
        {material === 'prominent' ? <View style={[fill, { borderRadius: r, backgroundColor: SOLID.prominent }]} /> : null}
        {children}
      </View>
    );
  }
  // Android/web: sem blur confiável → superfície sólida tonal com elevação Material.
  const bg = material === 'prominent' ? colors.primary : colors.secondaryGroupedBg;
  return <View style={[{ backgroundColor: bg, overflow: 'hidden', borderCurve: 'continuous' }, shadow, style]}>{children}</View>;
};

export const isLiquidGlass = glassAvailable;
