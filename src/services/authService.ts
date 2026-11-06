import { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { TipoUsuario } from '../types/database';

/** Traduz erros do Supabase Auth para mensagens claras em português. */
export function traduzirErroAuth(err: unknown): string {
  const msg = String((err as { message?: string })?.message ?? err ?? '').toLowerCase();
  if (msg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  if (msg.includes('already registered') || msg.includes('already been registered'))
    return 'Este e-mail já tem cadastro. Tente entrar.';
  if (msg.includes('password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (msg.includes('rate limit')) return 'Muitas tentativas. Aguarde um instante e tente de novo.';
  if (msg.includes('network') || msg.includes('fetch')) return 'Sem conexão. Verifique sua internet.';
  return 'Não foi possível concluir. Tente novamente.';
}

export class AuthService {
  static disponivel() {
    return isSupabaseConfigured();
  }

  static async sessaoAtual(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  static aoMudarSessao(cb: (s: Session | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_evt, session) => cb(session));
    return () => data.subscription.unsubscribe();
  }

  /**
   * Cria a conta. O perfil (e a linha de Responsável/Transportador)
   * é criado pelo gatilho `handle_new_user` no banco, a partir do metadata.
   * Retorna `precisaConfirmar = true` quando o projeto exige confirmação de e-mail.
   */
  static async cadastrar(p: {
    nome: string;
    email: string;
    senha: string;
    tipo: TipoUsuario;
    telefone?: string;
  }): Promise<{ precisaConfirmar: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email: p.email.trim().toLowerCase(),
      password: p.senha,
      options: { data: { nome: p.nome.trim(), tipo_usuario: p.tipo, telefone: p.telefone ?? '' } },
    });
    if (error) throw error;
    return { precisaConfirmar: !data.session };
  }

  static async entrar(email: string, senha: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    });
    if (error) throw error;
  }

  static async recuperarSenha(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) throw error;
  }

  static async sair() {
    await supabase.auth.signOut();
  }

  /** Exclusão de conta exigida pela App Store: apaga dados do usuário via perfil (cascade). */
  static async excluirConta(userId: string) {
    const { error } = await (supabase as any).from('perfis').delete().eq('id', userId);
    if (error) throw error;
    await supabase.auth.signOut();
  }
}
