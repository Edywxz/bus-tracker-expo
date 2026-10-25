import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Configurações do Supabase obtidas via variáveis de ambiente do Expo (EXPO_PUBLIC_*)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://SEU_PROJETO.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'SUA_CHAVE_ANON_PUBLICA';

export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('seu-projeto')
  );
};

/**
 * Cliente Supabase com tipagem estrita gerada pelo schema do banco de dados
 * e persistência de sessão assíncrona via AsyncStorage.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
