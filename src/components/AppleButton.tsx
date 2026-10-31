import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';

interface AppleButtonProps {
  onPress: () => void;
  children?: React.ReactNode;
  title?: string;
  variant?: 'primary' | 'secondary' | 'tonal' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export const AppleButton: React.FC<AppleButtonProps> = ({
  onPress,
  children,
  title,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  style,
  textStyle,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 25,
        bounciness: 0,
      }),
      Animated.timing(opacity, {
        toValue: 0.88,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          bg: colors.surface,
          border: colors.border,
          borderWidth: 1,
          textColor: colors.textPrimary,
        };
      case 'tonal':
        return {
          bg: colors.accentLight,
          border: 'transparent',
          borderWidth: 0,
          textColor: colors.accentText,
        };
      case 'destructive':
        return {
          bg: colors.systemRedLight,
          border: 'transparent',
          borderWidth: 0,
          textColor: colors.systemRed,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          border: 'transparent',
          borderWidth: 0,
          textColor: colors.accentDark,
        };
      case 'primary':
      default:
        return {
          bg: colors.accent,
          border: 'transparent',
          borderWidth: 0,
          textColor: '#FFFFFF',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 10,
          fontSize: 13,
        };
      case 'lg':
        return {
          paddingVertical: 16,
          paddingHorizontal: 22,
          borderRadius: 16,
          fontSize: 16,
        };
      case 'md':
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 14,
          fontSize: 14,
        };
    }
  };

  const vStyle = getVariantStyles();
  const sStyle = getSizeStyles();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={{ opacity: disabled ? 0.45 : 1 }}
    >
      <Animated.View
        style={[
          styles.base,
          {
            backgroundColor: vStyle.bg,
            borderColor: vStyle.border,
            borderWidth: vStyle.borderWidth,
            paddingVertical: sStyle.paddingVertical,
            paddingHorizontal: sStyle.paddingHorizontal,
            borderRadius: sStyle.borderRadius,
            transform: [{ scale }],
            opacity,
          },
          variant === 'primary' && styles.primaryShadow,
          style,
        ]}
      >
        {icon}
        {title ? (
          <Text
            style={[
              styles.text,
              {
                color: vStyle.textColor,
                fontSize: sStyle.fontSize,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        ) : (
          children
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  text: {
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  primaryShadow: {
    ...Platform.select({
      ios: {
        shadowColor: colors.accentDark,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});

