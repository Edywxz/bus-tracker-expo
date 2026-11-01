import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { motion } from '../../theme/tokens';

interface Props {
  children: React.ReactNode;
  /** Posição na sequência: define o atraso escalonado */
  index?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

/** Entrada suave: sobe e aparece, em cascata conforme `index`. */
export const FadeInUp: React.FC<Props> = ({ children, index = 0, distance = 14, style }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: motion.duration.slow,
      delay: Math.min(index, 8) * motion.stagger,
      easing: motion.easing,
      useNativeDriver: true,
    }).start();
  }, [progress, index]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};
