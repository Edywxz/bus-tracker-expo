import React, { useRef } from 'react';
import { Animated, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { type } from '../../theme/type';
import { TouchableScale } from './TouchableScale';
import { FadeInUp } from './FadeInUp';
import { useIsPushed, useStackOptional } from '../../navigation/Stack';

interface Props {
  title: string;
  subtitle?: string;
  /** Botão/ação à direita da barra superior */
  right?: React.ReactNode;
  onRefresh?: () => Promise<void> | void;
  refreshing?: boolean;
  children: React.ReactNode;
  /** Rodapé fixo (ação principal da tela) */
  footer?: React.ReactNode;
  backLabel?: string;
}

/**
 * Tela com título grande que rola e vira título inline na barra (padrão iOS).
 * Em telas empilhadas mostra o botão Voltar à esquerda.
 */
export const LargeTitleScreen: React.FC<Props> = ({
  title, subtitle, right, onRefresh, refreshing, children, footer, backLabel = 'Voltar',
}) => {
  const pushed = useIsPushed();
  const ctx = useStackOptional();
  const stack = pushed ? ctx : null;
  const y = useRef(new Animated.Value(0)).current;
  const [busy, setBusy] = React.useState(false);

  const doRefresh = async () => {
    if (!onRefresh) return;
    setBusy(true);
    try { await onRefresh(); } finally { setBusy(false); }
  };

  return (
    <View style={styles.root}>
      <View style={styles.bar}>
        <View style={styles.barSide}>
          {stack ? (
            <TouchableScale onPress={stack.pop} style={styles.back} accessibilityRole="button" accessibilityLabel={backLabel} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
              <Text style={styles.backText}>{backLabel}</Text>
            </TouchableScale>
          ) : null}
        </View>
        <Animated.Text
          numberOfLines={1}
          style={[styles.inline, { opacity: y.interpolate({ inputRange: [24, 56], outputRange: [0, 1], extrapolate: 'clamp' }) }]}
        >
          {title}
        </Animated.Text>
        <View style={[styles.barSide, { alignItems: 'flex-end' }]}>{right}</View>
      </View>
      <Animated.View
        pointerEvents="none"
        style={[styles.barLine, { opacity: y.interpolate({ inputRange: [20, 50], outputRange: [0, 1], extrapolate: 'clamp' }) }]}
      />
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y } } }], { useNativeDriver: true })}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing ?? busy} onRefresh={doRefresh} tintColor={colors.textTertiary} /> : undefined}
      >
        <FadeInUp distance={8} style={{ marginBottom: 14 }}>
          <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={1.3}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </FadeInUp>
        {children}
      </Animated.ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  bar: { height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  barSide: { width: 96, justifyContent: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  backText: { ...type.body, color: colors.textPrimary, marginLeft: -2 },
  inline: { flex: 1, textAlign: 'center', ...type.headline, color: colors.textPrimary },
  barLine: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderOpaque },
  content: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 28 },
  title: { ...type.largeTitle, color: colors.textPrimary },
  subtitle: { ...type.subhead, color: colors.textTertiary, marginTop: 2 },
  footer: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, backgroundColor: colors.background },
});
