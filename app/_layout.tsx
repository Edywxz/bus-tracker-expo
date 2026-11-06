import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { AppProvider, useApp } from '../src/context/AppContext';
import { detailOptions, Icon } from '../src/components/ds';
import { colors } from '../src/theme/colors';
import { motion, radius } from '../src/theme/tokens';

/**
 * VanEscolar GPS — acompanhamento de transporte escolar.
 * Fluxo: abertura → apresentação/conta (ou modo de exemplo) → abas por perfil.
 * Navegação 100% nativa: Stack nativo + NativeTabs (Liquid Glass no iOS 26 · Material no Android).
 */
SystemUI.setBackgroundColorAsync(colors.groupedBg).catch(() => {});

const Splash: React.FC = () => {
  const o = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(o, { toValue: 1, duration: motion.duration.slow, easing: motion.easing, useNativeDriver: true }).start();
  }, [o]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.groupedBg, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Carregando">
      <Animated.View style={{ opacity: o, transform: [{ scale: o.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }}>
        <View style={{ width: 84, height: 84, borderRadius: radius.xl, borderCurve: 'continuous', backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="van" size={40} color={colors.onSignal} />
        </View>
      </Animated.View>
    </View>
  );
};

function RootNavigator() {
  const { authStatus } = useApp();
  if (authStatus === 'carregando') return <Splash />;
  const logado = authStatus !== 'deslogado';
  return (
    <Stack screenOptions={detailOptions}>
      <Stack.Protected guard={!logado}>
        <Stack.Screen name="entrar" options={{ headerShown: false, animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={logado}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="conversa" options={{ title: 'Conversa' }} />
        <Stack.Screen name="aluno/[id]" options={{ title: 'Detalhes' }} />
        <Stack.Screen name="pino" options={{ title: 'Confirmar localização' }} />
        <Stack.Screen name="contrato/[alunoId]" options={{ title: 'Contrato' }} />
        <Stack.Screen name="mensalidade/[id]" options={{ title: 'Mensalidade' }} />
        <Stack.Screen name="veiculo" options={{ title: 'Veículo' }} />
        <Stack.Screen name="escola" options={{ title: 'Escola e contatos' }} />
        <Stack.Screen name="calendario" options={{ title: 'Calendário letivo' }} />
        <Stack.Screen name="privacidade" options={{ title: 'Seus dados' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppProvider>
  );
}
