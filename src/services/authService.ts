import { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { TipoUsuario } from '../types/database';
import { lerLinkAuth } from '../utils/authLink';
import { urlDoSite } from '../utils/siteUrl';

/** Traduz erros do Supabase Auth para mensagens claras em português. */
export function traduzirErroAuth(err: unknown): string {
  const msg = String((err as { message?: string })?.message ?? err ?? '').toLowerCase();
  if (msg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  if (msg.includes('already registered') || msg.includes('already been registered'))
    return 'Este e-mail já tem cadastro. Cada e-mail serve para um só perfil (responsável ou motorista). Entre ou recupere a senha.';
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
      options: {
        emailRedirectTo: urlDoSite('confirmado/', process.env.EXPO_PUBLIC_SITE_URL), // página do site (precisa estar nas Redirect URLs do Supabase)
        data: { nome: p.nome.trim(), tipo_usuario: p.tipo, telefone: p.telefone ?? '' },
      },
    });
    if (error) throw error;
    // E-mail já cadastrado: o Supabase não dá erro, devolve um usuário sem identidades e não envia e-mail.
    if (data.user && (data.user.identities?.length ?? 0) === 0) throw new Error('User already registered');
    return { precisaConfirmar: !data.session };
  }

  static async reenviarConfirmacao(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup', email: email.trim().toLowerCase(), options: { emailRedirectTo: urlDoSite('confirmado/', process.env.EXPO_PUBLIC_SITE_URL) },
    });
    if (error) throw error;
  }

  /** Link recebido por e-mail (confirmação): abre a sessão. Devolve a mensagem de erro, se houver. */
  static async tratarLink(url: string): Promise<string | null> {
    const l = lerLinkAuth(url);
    if (!l) return null;
    if (l.erro) return l.erro;
    if (l.tipo === 'recovery') return null; // redefinição de senha agora é tratada pela página web (site/redefinir-senha)
    const { error } = await supabase.auth.setSession({ access_token: l.sessao!.accessToken, refresh_token: l.sessao!.refreshToken });
    return error ? traduzirErroAuth(error) : null;
  }

  static async entrar(email: string, senha: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    });
    if (error) throw error;
  }

  static async recuperarSenha(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: urlDoSite('redefinir-senha/', process.env.EXPO_PUBLIC_SITE_URL),
    });
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
