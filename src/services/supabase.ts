import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase obtidas via variáveis de ambiente do Expo (EXPO_PUBLIC_*)
// Para configurar, crie um arquivo .env na raiz do projeto com estas variáveis
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://seu-projeto.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sua-chave-anon-publica';

export const isSupabaseConfigured = () => {
  return (
    Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) &&
    !process.env.EXPO_PUBLIC_SUPABASE_URL?.includes('seu-projeto')
  );
};

/**
 * Cliente Supabase configurado com persistência de sessão assíncrona
 * via AsyncStorage para o ambiente Expo / React Native.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
