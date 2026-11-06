/**
 * Barras: navigation bar (cabeçalho nativo do Stack), botões de barra, toolbar flutuante e a tela
 * padrão com título grande. A tab bar é o NativeTabs em app/(tabs)/_layout.tsx.
 *
 * Navigation bar = cabeçalho nativo (UINavigationBar no iOS — vidro automático no iOS 26;
 * Top App Bar Material no Android). Nunca desenhe uma barra à mão.
 */
import React, { useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import type { NativeStackNavigationOptions } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { hitTarget, layout, radius, spacing } from '../../theme/tokens';
import { type } from '../../theme/type';
import { GlassSurface } from './glass';
import { Icon, IconName } from './icon';
import { PressableScale } from './pressable';

const ios = Platform.OS === 'ios';

/* ------------------------------------------------------------------ Opções de cabeçalho nativo */
/** Padrão para todo Stack do app. iOS: barra transparente (vidro do sistema no iOS 26). Android: Top App Bar Material. */
export const stackScreenOptions: NativeStackNavigationOptions = {
  headerBackButtonDisplayMode: 'minimal',
  headerTintColor: colors.primary,
  headerShadowVisible: false,
  headerTitleStyle: { color: colors.label, fontWeight: '600' },
  contentStyle: { backgroundColor: colors.groupedBg },
  ...(ios
    ? { headerTransparent: true, headerBlurEffect: 'systemChromeMaterial', headerLargeTitleShadowVisible: false, headerLargeTitleStyle: { color: colors.label } }
    : { headerStyle: { backgroundColor: colors.groupedBg }, animation: 'fade_from_bottom' }),
};

/** Raiz de aba: título grande (iOS). */
export const tabRootOptions: NativeStackNavigationOptions = { ...stackScreenOptions, headerLargeTitle: true };

/** Tela empurrada (detalhe): título padrão centralizado. */
export const detailOptions: NativeStackNavigationOptions = { ...stackScreenOptions, headerLargeTitle: false };

/* ------------------------------------------------------------------ Bar button */
/**
 * Botão de barra (headerLeft/headerRight). No iOS 26 o sistema envolve o item em vidro;
 * aqui só definimos glifo/rótulo e alvo de toque ≥ 44pt (48dp no Android).
 */
export const HeaderButton: React.FC<{ icon?: IconName; label: string; onPress: () => void; showLabel?: boolean; prominent?: boolean; disabled?: boolean }> = ({
  icon, label, onPress, showLabel, prominent, disabled,
}) => (
  <PressableScale onPress={onPress} disabled={disabled} hitSlop={8} accessibilityRole="button" accessibilityLabel={label}
    style={[hb.btn, prominent && !ios && { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, borderRadius: radius.full }]}>
    {icon ? <Icon name={icon} size={ios ? 20 : 24} color={prominent && !ios ? colors.onPrimary : colors.label} weight="medium" /> : null}
    {showLabel || !icon ? <Text style={[hb.text, prominent && { fontWeight: '600' }, prominent && !ios && { color: colors.onPrimary }]}>{label}</Text> : null}
  </PressableScale>
);
const hb = StyleSheet.create({
  btn: { minWidth: hitTarget - 8, minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs },
  text: { ...type.body, color: colors.label },
});

/* ------------------------------------------------------------------ Tela padrão */
interface ScreenProps {
  title: string;
  subtitle?: string;
  /** Ação(ões) à direita da barra. */
  headerRight?: React.ReactNode;
  onRefresh?: () => Promise<void> | void;
  children: React.ReactNode;
  /** Ação principal fixa no rodapé (barra chrome/vidro). */
  footer?: React.ReactNode;
  /** Sem ScrollView (ex.: tela de chat que gerencia a própria rolagem). */
  scroll?: boolean;
}

/**
 * Tela com cabeçalho nativo. O título vem do Stack (grande nas raízes de aba no iOS).
 * Conteúdo rola por baixo da barra de vidro com insets automáticos.
 */
export const Screen: React.FC<ScreenProps> = ({ title, subtitle, headerRight, onRefresh, children, footer, scroll = true }) => {
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();
  const refresh = async () => { if (!onRefresh) return; setBusy(true); try { await onRefresh(); } finally { setBusy(false); } };
  return (
    <View style={{ flex: 1, backgroundColor: colors.groupedBg }}>
      <Stack.Screen options={{ title, headerRight: headerRight ? () => headerRight : undefined }} />
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[sc.content, footer ? { paddingBottom: 120 } : null]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={onRefresh ? <RefreshControl refreshing={busy} onRefresh={refresh} tintColor={colors.secondaryLabel} colors={[colors.primary]} /> : undefined}
        >
          {subtitle ? <Text style={sc.subtitle}>{subtitle}</Text> : null}
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
      {footer ? (
        <GlassSurface material="chrome" floating={false} style={[sc.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) + (ios ? 0 : spacing.xs) }]}>
          <View style={{ paddingHorizontal: layout.gutter, paddingTop: spacing.md }}>{footer}</View>
        </GlassSurface>
      ) : null}
    </View>
  );
};
const sc = StyleSheet.create({
  content: { paddingHorizontal: layout.gutter, paddingTop: spacing.xs, paddingBottom: spacing.xxxl, gap: 0 },
  subtitle: { ...type.subheadline, color: colors.secondaryLabel, marginBottom: spacing.lg, marginTop: ios ? 0 : spacing.sm },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, borderRadius: 0, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
});

/* ------------------------------------------------------------------ Toolbar flutuante */
export interface ToolbarItem { key: string; label: string; icon?: IconName; onPress: () => void; prominent?: boolean; disabled?: boolean; showLabel?: boolean }

/** Grupo de ações em vidro flutuando na base da tela (ex.: controles do motorista). Uma ação prominent no máximo. */
export const Toolbar: React.FC<{ items: (ToolbarItem | 'separator')[] }> = ({ items }) => (
  <GlassSurface interactive style={tb.bar}>
    <View style={tb.row}>
      {items.map((it, i) =>
        it === 'separator' ? <View key={`s${i}`} style={tb.sep} /> : (
          <PressableScale key={it.key} onPress={it.onPress} disabled={it.disabled} accessibilityRole="button" accessibilityLabel={it.label}
            style={[tb.item, it.prominent && tb.prominent]}>
            {it.icon ? <Icon name={it.icon} size={18} color={it.prominent ? colors.onPrimary : colors.label} weight="medium" /> : null}
            {it.showLabel || it.prominent || !it.icon ? <Text style={[tb.text, it.prominent && { color: colors.onPrimary, fontWeight: '600' }]}>{it.label}</Text> : null}
          </PressableScale>
        ))}
    </View>
  </GlassSurface>
);
const tb = StyleSheet.create({
  bar: { borderRadius: radius.full, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, height: 52, paddingHorizontal: spacing.s6 },
  item: { minWidth: hitTarget, height: 40, paddingHorizontal: spacing.sm, flexDirection: 'row', gap: spacing.s6, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  prominent: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg },
  text: { ...type.subheadline, fontWeight: '500', color: colors.label },
  sep: { width: StyleSheet.hairlineWidth, height: 22, backgroundColor: colors.separator },
});
