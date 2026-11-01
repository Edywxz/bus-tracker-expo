import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { motion } from '../../theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Escala ao pressionar. Padrão 0.97 */
  pressedScale?: number;
  /** Compatibilidade com TouchableOpacity (ignorado: usamos mola) */
  activeOpacity?: number;
}

/**
 * Substituto direto de TouchableOpacity com mola de escala.
 * Mantém um único nó de view, então o layout não muda.
 */
export const TouchableScale: React.FC<Props> = ({
  style,
  pressedScale = 0.97,
  activeOpacity,
  onPressIn,
  onPressOut,
  disabled,
  children,
  ...rest
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const to = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      ...motion.spring.press,
    }).start();

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        to(pressedScale);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        to(1);
        onPressOut?.(e);
      }}
      style={[StyleSheet.flatten(style), { transform: [{ scale }] }, disabled && { opacity: 0.5 }]}
    >
      {children}
    </AnimatedPressable>
  );
};

export { TouchableScale as TouchableOpacity };
