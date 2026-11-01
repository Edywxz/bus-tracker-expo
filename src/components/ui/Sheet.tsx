import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fill, motion, radius } from '../../theme/tokens';
import { type } from '../../theme/type';
import { TouchableScale } from './TouchableScale';

const H = Dimensions.get('window').height;

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Botão fixo no rodapé (ação principal) */
  footer?: React.ReactNode;
  /** Altura máxima como fração da tela. Padrão 0.9 */
  maxHeight?: number;
}

/**
 * Sheet modal: sobe com mola, fecha arrastando para baixo ou tocando fora.
 * Cancelar/fechar fica no topo; a ação principal fica no rodapé.
 */
export const Sheet: React.FC<Props> = ({ visible, onClose, title, subtitle, children, footer, maxHeight = 0.9 }) => {
  const [mounted, setMounted] = useState(visible);
  const y = useRef(new Animated.Value(H)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(y, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 3 }),
        Animated.timing(fade, { toValue: 1, duration: motion.duration.base, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(y, { toValue: H, duration: 240, easing: motion.easing, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => finished && setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => { if (g.dy > 0) y.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 110 || g.vy > 0.9) onClose();
        else Animated.spring(y, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
      },
    })
  ).current;

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fechar" />
      </Animated.View>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.sheet, { maxHeight: H * maxHeight, transform: [{ translateY: y }] }]}>
          <View {...pan.panHandlers}>
            <View style={styles.grabber} />
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                {title ? <Text style={styles.title} accessibilityRole="header">{title}</Text> : null}
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              <TouchableScale onPress={onClose} style={styles.close} accessibilityLabel="Fechar" accessibilityRole="button">
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableScale>
            </View>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
            bounces={false}
          >
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { ...fill, backgroundColor: colors.overlay },
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  grabber: { alignSelf: 'center', width: 38, height: 5, borderRadius: 3, backgroundColor: colors.borderOpaque, marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 22, paddingTop: 14, paddingBottom: 8, gap: 12 },
  title: { ...type.title3, color: colors.textPrimary },
  subtitle: { ...type.subhead, color: colors.textTertiary, marginTop: 2 },
  close: {
    width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  body: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 20, gap: 16 },
  footer: {
    paddingHorizontal: 22, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 30 : 18,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
});
