import React, { useEffect, useRef } from 'react';
import { Animated, Platform, SafeAreaView, StatusBar as RNStatusBar, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useApp } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthFlow } from './src/flows/AuthFlow';
import { colors } from './src/theme/colors';
import { motion } from './src/theme/tokens';

/**
 * VanEscolar GPS — acompanhamento de transporte escolar.
 * Fluxo: abertura → apresentação → conta (ou modo de exemplo) → app por perfil.
 */
const Splash: React.FC = () => {
  const o = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(o, { toValue: 1, duration: motion.duration.slow, useNativeDriver: true }).start();
  }, [o]);
  return (
    <View style={s.splash}>
      <Animated.View style={{ opacity: o, transform: [{ scale: o.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }}>
        <View style={s.logo}><Ionicons name="bus" size={34} color={colors.accent} /></View>
      </Animated.View>
    </View>
  );
};

const Root: React.FC = () => {
  const { authStatus } = useApp();
  if (authStatus === 'carregando') return <Splash />;
  if (authStatus === 'deslogado') return <AuthFlow />;
  return (
    <SafeAreaView style={s.safe}>
      <AppNavigator />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <AppProvider>
      <View style={s.root}>
        <StatusBar style="dark" />
        <Root />
      </View>
    </AppProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 24 : 0 },
  splash: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 84, height: 84, borderRadius: 28, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
});
