import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Com o app aberto, mostra o aviso como banner (por padrão o sistema o esconderia).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false,
  }),
});

let tokenAtual: string | null = null;

export class PushService {
  /** Pede permissão, obtém o token Expo e o vincula ao usuário logado. Nunca lança: push é opcional. */
  static async registrar(): Promise<void> {
    try {
      if (!Device.isDevice) return; // simulador/emulador não recebe push
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Avisos', importance: Notifications.AndroidImportance.HIGH,
        });
      }
      let { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
      if (status !== 'granted') return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) { console.warn('[Push] projectId do EAS ausente (rode `eas init`).'); return; }
      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

      const { error } = await (supabase as any).rpc('registrar_push_token', {
        p_token: token, p_plataforma: Platform.OS === 'ios' ? 'ios' : 'android',
      });
      if (error) throw error;
      tokenAtual = token;
    } catch (e) {
      console.warn('[Push] Falha ao registrar:', e);
    }
  }

  /** Antes de sair da conta: este aparelho deixa de receber os avisos do usuário. */
  static async desregistrar(): Promise<void> {
    if (!tokenAtual) return;
    try {
      await (supabase as any).from('push_tokens').delete().eq('token', tokenAtual);
    } catch { /* sem rede: o token será reatribuído no próximo login de quem usar o aparelho */ }
    tokenAtual = null;
  }
}
