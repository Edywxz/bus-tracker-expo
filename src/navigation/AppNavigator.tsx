import React, { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { motion, radius, shadows } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import { StackHost } from './Stack';

import { HomeScreen } from '../screens/HomeScreen';
import { StudentsScreen } from '../screens/StudentsScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { PaymentsScreen } from '../screens/PaymentsScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { ContractScreen, PaymentDetailScreen, StudentDetailScreen } from '../screens/DetailScreens';
import { CalendarScreen, PrivacyScreen, SchoolScreen, VehicleScreen } from '../screens/InfoScreens';

type TabKey = 'HOME' | 'STUDENTS' | 'MESSAGES' | 'PAYMENTS' | 'ACCOUNT';
type IconName = keyof typeof Ionicons.glyphMap;

const SCREENS: Record<TabKey, React.ComponentType> = {
  HOME: HomeScreen, STUDENTS: StudentsScreen, MESSAGES: MessagesScreen, PAYMENTS: PaymentsScreen, ACCOUNT: AccountScreen,
};

const PUSHED = {
  StudentDetail: StudentDetailScreen as React.ComponentType<{ params?: any }>,
  Contract: ContractScreen as React.ComponentType<{ params?: any }>,
  PaymentDetail: PaymentDetailScreen as React.ComponentType<{ params?: any }>,
  Vehicle: VehicleScreen as React.ComponentType<{ params?: any }>,
  School: SchoolScreen as React.ComponentType<{ params?: any }>,
  Calendar: CalendarScreen as React.ComponentType<{ params?: any }>,
  Privacy: PrivacyScreen as React.ComponentType<{ params?: any }>,
};

const BAR_PADDING = 6;

/** Entrada da aba: desliza na direção da navegação com fade e leve escala. */
const AnimatedTab: React.FC<{ direction: number; children: React.ReactNode }> = ({ direction, children }) => {
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(p, { toValue: 1, duration: motion.duration.slow, easing: motion.easing, useNativeDriver: true }).start();
  }, [p]);
  return (
    <Animated.View style={{
      flex: 1,
      opacity: p.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.9, 1] }),
      transform: [
        { translateX: p.interpolate({ inputRange: [0, 1], outputRange: [24 * direction, 0] }) },
        { scale: p.interpolate({ inputRange: [0, 1], outputRange: [0.99, 1] }) },
      ],
    }}>
      {children}
    </Animated.View>
  );
};

const TabButton: React.FC<{ icon: IconName; label: string; active: boolean; badge?: number; onPress: () => void }> = ({ icon, label, active, badge, onPress }) => {
  const lift = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(lift, { toValue: active ? 1 : 0, useNativeDriver: true, ...motion.spring.snappy }).start();
  }, [active, lift]);
  return (
    <Pressable style={s.tabItem} onPress={onPress} accessibilityRole="tab"
      accessibilityLabel={badge ? `${label}, ${badge} novos` : label} accessibilityState={{ selected: active }}>
      <Animated.View style={{ alignItems: 'center', transform: [
        { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [2, -1] }) },
        { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
      ] }}>
        <View style={s.iconBox}>
          <Ionicons name={active ? icon : (`${icon}-outline` as IconName)} size={22} color={active ? '#fff' : colors.textTertiary} />
          {badge ? <View style={s.badge}><Text style={s.badgeText}>{badge > 9 ? '9+' : badge}</Text></View> : null}
        </View>
        <Text style={[s.label, active && { color: '#fff' }]} numberOfLines={1} maxFontSizeMultiplier={1.15}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
};

const Tabs: React.FC = () => {
  const { role, notificacoes, offlineQueueCount } = useApp();
  const [active, setActive] = useState<TabKey>('HOME');
  const [barW, setBarW] = useState(0);
  const prev = useRef(0);
  const dir = useRef(1);
  const x = useRef(new Animated.Value(0)).current;
  const unread = notificacoes.filter((n) => !n.lida).length;

  const tabs: { key: TabKey; label: string; icon: IconName; badge?: number }[] = [
    { key: 'HOME', label: role === 'TRANSPORTADOR' ? 'Rota' : role === 'INSTITUICAO' ? 'Chegadas' : 'Início', icon: role === 'TRANSPORTADOR' ? 'navigate' : 'home' },
    { key: 'STUDENTS', label: role === 'TRANSPORTADOR' ? 'Embarque' : 'Alunos', icon: 'people', badge: role === 'TRANSPORTADOR' ? offlineQueueCount || undefined : undefined },
    { key: 'MESSAGES', label: 'Recados', icon: 'chatbubbles', badge: unread || undefined },
    ...(role !== 'INSTITUICAO' ? [{ key: 'PAYMENTS' as TabKey, label: role === 'TRANSPORTADOR' ? 'Receber' : 'Financeiro', icon: 'wallet' as IconName }] : []),
    { key: 'ACCOUNT', label: 'Conta', icon: 'person-circle' },
  ];

  const current: TabKey = tabs.some((t) => t.key === active) ? active : 'HOME';
  const index = tabs.findIndex((t) => t.key === current);
  const slot = barW ? (barW - BAR_PADDING * 2) / tabs.length : 0;

  useEffect(() => {
    if (slot) Animated.spring(x, { toValue: index * slot, useNativeDriver: true, ...motion.spring.snappy }).start();
  }, [index, slot, x]);

  const select = (k: TabKey) => {
    if (k === current) return;
    const n = tabs.findIndex((t) => t.key === k);
    dir.current = n > prev.current ? 1 : -1;
    prev.current = n;
    setActive(k);
  };

  const Screen = SCREENS[current];
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <AnimatedTab key={current + role} direction={dir.current}><Screen /></AnimatedTab>
      </View>
      <View style={s.barWrap}>
        <View style={s.bar} onLayout={(e: LayoutChangeEvent) => setBarW(e.nativeEvent.layout.width)} accessibilityRole="tablist">
          {slot > 0 && <Animated.View pointerEvents="none" style={[s.indicator, { width: slot, transform: [{ translateX: x }] }]} />}
          {tabs.map((t) => (
            <TabButton key={t.key} icon={t.icon} label={t.label} badge={t.badge} active={current === t.key} onPress={() => select(t.key)} />
          ))}
        </View>
      </View>
    </View>
  );
};

export const AppNavigator: React.FC = () => <StackHost base={<Tabs />} screens={PUSHED} />;

const s = StyleSheet.create({
  barWrap: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 6 : 14, backgroundColor: colors.background },
  bar: {
    flexDirection: 'row', padding: BAR_PADDING, borderRadius: radius.pill, backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.glassBorder, ...shadows.floating,
  },
  indicator: { position: 'absolute', top: BAR_PADDING, bottom: BAR_PADDING, left: BAR_PADDING, borderRadius: radius.pill, backgroundColor: colors.ink },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, minHeight: 52 },
  iconBox: { width: 28, height: 24, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: -5, right: -5, backgroundColor: colors.systemRed, borderRadius: 8, paddingHorizontal: 4,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.surface,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  label: { fontSize: 10, color: colors.textTertiary, fontWeight: '600', marginTop: 2, letterSpacing: -0.1 },
});
