import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';

// Telas do Aplicativo
import { LiveTrackingScreen } from '../screens/LiveTrackingScreen';
import { BoardingLogScreen } from '../screens/BoardingLogScreen';
import { PaymentsScreen } from '../screens/PaymentsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ContactsScreen } from '../screens/ContactsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type TabRoute =
  | 'TRACKING'
  | 'BOARDING'
  | 'PAYMENTS'
  | 'MESSAGES'
  | 'CONTACTS'
  | 'PROFILE';

export const AppNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabRoute>('TRACKING');
  const { notificacoes, offlineQueueCount, role } = useApp();

  const unreadNotifCount = notificacoes.filter((n) => !n.lida).length;

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'TRACKING':
        return <LiveTrackingScreen />;
      case 'BOARDING':
        return <BoardingLogScreen />;
      case 'PAYMENTS':
        return <PaymentsScreen />;
      case 'MESSAGES':
        return <NotificationsScreen />;
      case 'CONTACTS':
        return <ContactsScreen />;
      case 'PROFILE':
        return <ProfileScreen />;
      default:
        return <LiveTrackingScreen />;
    }
  };

  const getScreenTitle = () => {
    switch (activeTab) {
      case 'TRACKING':
        return {
          title: 'Rastreamento',
          subtitle: 'Acompanhe a van em tempo real com telemetria GPS (RF003)',
        };
      case 'BOARDING':
        return {
          title: 'Embarque',
          subtitle:
            role === 'TRANSPORTADOR'
              ? 'Controle de entrada e saída com sincronização offline (RF007)'
              : 'Status em tempo real do transporte do aluno (RF002)',
        };
      case 'PAYMENTS':
        return {
          title: 'Financeiro',
          subtitle: 'Liquidação de mensalidades com PIX, Cartão e Boleto (RF005)',
        };
      case 'MESSAGES':
        return {
          title: 'Recados',
          subtitle: 'Alertas automáticos de rota e comunicação direta (RF004, RF008)',
        };
      case 'CONTACTS':
        return {
          title: 'Escola & Contatos',
          subtitle: 'Pessoas autorizadas e calendário letivo oficial (RF018, RF019)',
        };
      case 'PROFILE':
        return {
          title: 'Perfil & Gestão',
          subtitle: 'Dados cadastrais, alvará e configurações de privacidade (RF010, RF013)',
        };
    }
  };

  const currentTitle = getScreenTitle();

  const tabs: {
    key: TabRoute;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    badge?: number;
  }[] = [
    { key: 'TRACKING', label: 'Rastreio', icon: 'navigate' },
    {
      key: 'BOARDING',
      label: 'Embarque',
      icon: 'people',
      badge: offlineQueueCount > 0 ? offlineQueueCount : undefined,
    },
    { key: 'PAYMENTS', label: 'Financeiro', icon: 'card' },
    {
      key: 'MESSAGES',
      label: 'Recados',
      icon: 'chatbubbles',
      badge: unreadNotifCount > 0 ? unreadNotifCount : undefined,
    },
    { key: 'CONTACTS', label: 'Escola', icon: 'school' },
    { key: 'PROFILE', label: 'Perfil', icon: 'person' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabeçalho Apple */}
      <Header title={currentTitle.title} subtitle={currentTitle.subtitle} />

      {/* Conteúdo da Tela Selecionada */}
      <View style={styles.content}>{renderActiveScreen()}</View>

      {/* Barra Inferior de Navegação Estilo iOS Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.65}
            >
              <View style={styles.iconBox}>
                <Ionicons
                  name={tab.icon}
                  size={21}
                  color={isActive ? colors.accentDark : colors.textTertiary}
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconBox: {
    position: 'relative',
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.systemRed,
    borderRadius: 7,
    paddingHorizontal: 4,
    paddingVertical: 0.5,
    minWidth: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  tabLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: '500',
    marginTop: 3,
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    color: colors.accentDark,
    fontWeight: '700',
  },
});
