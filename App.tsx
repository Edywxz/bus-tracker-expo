import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { AppProvider } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';

/**
 * VanEscolar GPS — Aplicativo Mobile para Transporte Escolar Autônomo
 * Desenvolvido em Expo / React Native com design nativo para Android e iOS.
 * Atende aos Requisitos Funcionais (RF001 a RF021) e Não Funcionais (RNF001 a RNF008).
 * Idioma: Português do Brasil (pt-br).
 */
export default function App() {
  return (
    <AppProvider>
      <View style={styles.rootContainer}>
        <StatusBar style="dark" />
        <AppNavigator />
      </View>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
});
