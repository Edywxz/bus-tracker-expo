import React, { useRef } from 'react';
import { Animated, Platform, Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { motion, state } from '../../theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Escala ao pressionar (default --pressed-scale .97). */
  pressedScale?: number;
  /** Ripple Material no Android (default true). */
  ripple?: boolean;
}

/**
 * Toque com mola de escala (iOS) + ripple Material (Android).
 * Mantém um único nó de view, então o layout não muda.
 */
export const PressableScale: React.FC<PressableScaleProps> = ({
  style, pressedScale = state.pressedScale, ripple = true, onPressIn, onPressOut, disabled, children, ...rest
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value: number) => Animated.spring(scale, { toValue: value, useNativeDriver: true, ...motion.spring.press }).start();
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      android_ripple={ripple && Platform.OS === 'android' ? { color: colors.fill2, borderless: false, foreground: true } : undefined}
      onPressIn={(e) => { if (Platform.OS === 'ios') to(pressedScale); onPressIn?.(e); }}
      onPressOut={(e) => { if (Platform.OS === 'ios') to(1); onPressOut?.(e); }}
      style={[StyleSheet.flatten(style), { transform: [{ scale }] }, disabled ? { opacity: state.disabledOpacity } : null]}
    >
      {children}
    </AnimatedPressable>
  );
};

/** Feedback tátil leve — só iOS (Android usa ripple). */
export const haptic = {
  light: () => { if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); },
  success: () => { if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); },
  warning: () => { if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}); },
  selection: () => { if (Platform.OS === 'ios') Haptics.selectionAsync().catch(() => {}); },
};
