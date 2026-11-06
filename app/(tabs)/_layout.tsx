import { Platform } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useApp } from '../../src/context/AppContext';
import { colors } from '../../src/theme/colors';

/**
 * Tab bar — NativeTabs.
 * iOS 26: cápsula de Liquid Glass do sistema (minimiza ao rolar). iOS < 26: UITabBar com material.
 * Android: Material 3 bottom navigation com indicador. Até 5 abas; rótulos por perfil.
 */
export default function TabsLayout() {
  const { role, notificacoes, offlineQueueCount } = useApp();
  const unread = notificacoes.filter((n) => !n.lida).length;
  const motorista = role === 'TRANSPORTADOR';
  const escola = role === 'INSTITUICAO';
  const android = Platform.OS === 'android';

  return (
    <NativeTabs
      tintColor={colors.primary}
      iconColor={android ? colors.secondaryLabel : undefined}
      minimizeBehavior="onScrollDown"
      backgroundColor={android ? colors.secondaryGroupedBg : undefined}
      indicatorColor={colors.signalContainer}
      labelVisibilityMode="labeled"
      labelStyle={{ fontSize: 10, fontWeight: '500' }}
      badgeBackgroundColor={colors.error}
    >
      <NativeTabs.Trigger name="(inicio)">
        <NativeTabs.Trigger.Label>{escola ? 'Chegadas' : 'Rota'}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} md="map" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(alunos)">
        <NativeTabs.Trigger.Label>{motorista ? 'Embarque' : 'Alunos'}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
        {motorista && offlineQueueCount > 0 ? <NativeTabs.Trigger.Badge>{String(offlineQueueCount)}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(recados)">
        <NativeTabs.Trigger.Label>Recados</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }} md="forum" />
        {unread > 0 ? <NativeTabs.Trigger.Badge>{unread > 9 ? '9+' : String(unread)}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(financeiro)" hidden={escola}>
        <NativeTabs.Trigger.Label>{motorista ? 'Receber' : 'Pagar'}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'wallet.bifold', selected: 'wallet.bifold.fill' }} md="account_balance_wallet" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(conta)">
        <NativeTabs.Trigger.Label>Conta</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
