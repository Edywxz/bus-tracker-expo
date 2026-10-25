import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// ⚠️  NUNCA adicione chaves reais aqui. Use variáveis de ambiente EXPO_PUBLIC_*
// Configure o arquivo .env na raiz do projeto (veja .env.example).
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Variáveis de ambiente EXPO_PUBLIC_SUPABASE_URL e ' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY não estão definidas. ' +
    'Configure o arquivo .env na raiz do projeto.'
  );
}

export const isSupabaseConfigured = () =>
  Boolean(supabaseUrl) && Boolean(supabaseAnonKey);

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
