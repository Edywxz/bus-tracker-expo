import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { motion, radius, elevation } from '../theme/tokens';
import { type } from '../theme/type';
import { Button, Icon, IconName, Notice, PressableScale as TouchableScale, TextField } from '../components/ui/kit';
import { useApp } from '../context/AppContext';
import { AuthService, traduzirErroAuth } from '../services/authService';
import { TipoUsuario } from '../types/database';

const W = Dimensions.get('window').width;

type Step = 'boasvindas' | 'entrar' | 'perfil' | 'cadastro' | 'confirmar' | 'recuperar';

const SLIDES: { icon: IconName; title: string; text: string; tint: string }[] = [
  { icon: 'van', title: 'Veja a van chegando', text: 'Acompanhe o trajeto em tempo real e saiba exatamente quando o aluno embarca e desembarca.', tint: colors.signalContainer },
  { icon: 'shield', title: 'Mais segurança no dia a dia', text: 'Pessoas autorizadas, avisos de ocorrência na rota e registro de cada embarque, mesmo sem sinal.', tint: colors.infoContainer },
  { icon: 'wallet', title: 'Mensalidades sem complicação', text: 'Pague por PIX ou boleto, receba o recibo e converse com o motorista no mesmo lugar.', tint: colors.successContainer },
];

const PAPEIS: { tipo: TipoUsuario; icon: IconName; titulo: string; texto: string }[] = [
  { tipo: 'RESPONSAVEL', icon: 'people', titulo: 'Sou pai, mãe ou responsável', texto: 'Acompanhar o trajeto, pagar e avisar faltas' },
  { tipo: 'TRANSPORTADOR', icon: 'van', titulo: 'Sou motorista', texto: 'Conduzir rotas, registrar embarques e receber' },
];

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

/** Ilustração: ícone grande sobre círculos concêntricos com flutuação suave. */
const HeroArt: React.FC<{ icon: IconName; tint: string }> = ({ icon, tint }) => {
  const f = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(f, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(f, { toValue: 0, duration: 2200, useNativeDriver: true }),
    ]));
    l.start();
    return () => l.stop();
  }, [f]);
  return (
    <View style={art.wrap}>
      <View style={[art.ring, { width: 260, height: 260, backgroundColor: tint, opacity: 0.35 }]} />
      <View style={[art.ring, { width: 190, height: 190, backgroundColor: tint, opacity: 0.7 }]} />
      <Animated.View style={[art.core, { transform: [{ translateY: f.interpolate({ inputRange: [0, 1], outputRange: [4, -6] }) }] }]}>
        <Icon name={icon} size={52} color={colors.onSignal} />
      </Animated.View>
    </View>
  );
};

export const AuthFlow: React.FC = () => {
  const { entrar, cadastrar, recuperarSenha, entrarDemo } = useApp();
  const [step, setStep] = useState<Step>('boasvindas');
  const [dir, setDir] = useState(1);
  const [page, setPage] = useState(0);
  const [tipo, setTipo] = useState<TipoUsuario>('RESPONSAVEL');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [campoErro, setCampoErro] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const senhaRef = useRef<any>(null);
  const emailRef = useRef<any>(null);
  const t = useRef(new Animated.Value(1)).current;
  const disponivel = AuthService.disponivel();

  const go = (s: Step, d = 1) => {
    setDir(d); setErro(null); setCampoErro({}); setInfo(null);
    t.setValue(0);
    setStep(s);
    Animated.timing(t, { toValue: 1, duration: 340, easing: motion.easing, useNativeDriver: true }).start();
  };

  const validar = (campos: ('nome' | 'email' | 'senha')[]) => {
    const e: Record<string, string> = {};
    if (campos.includes('nome') && nome.trim().length < 2) e.nome = 'Informe seu nome.';
    if (campos.includes('email') && !emailOk(email)) e.email = 'Digite um e-mail válido.';
    if (campos.includes('senha') && senha.length < 6) e.senha = 'Use pelo menos 6 caracteres.';
    setCampoErro(e);
    return Object.keys(e).length === 0;
  };

  const submeter = async (acao: () => Promise<void>) => {
    setLoading(true); setErro(null);
    try { await acao(); } catch (e) { setErro(traduzirErroAuth(e)); } finally { setLoading(false); }
  };

  const onEntrar = () => validar(['email', 'senha']) && submeter(() => entrar(email, senha));
  const onCadastrar = () =>
    validar(['nome', 'email', 'senha']) &&
    submeter(async () => {
      const r = await cadastrar({ nome, email, senha, tipo });
      if (r.precisaConfirmar) go('confirmar');
    });
  const onRecuperar = () =>
    validar(['email']) &&
    submeter(async () => { await recuperarSenha(email); setInfo('Enviamos um link para redefinir sua senha. Confira seu e-mail.'); });

  const slide = {
    opacity: t,
    transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [28 * dir, 0] }) }],
  };

  /* ------------------ Boas-vindas ------------------ */
  if (step === 'boasvindas') {
    return (
      <SafeAreaView style={s.root} edges={['top', 'bottom']}>
        <View style={s.topRow}>
          <View style={s.brand}>
            <View style={s.brandIcon}><Icon name="van" size={16} color={colors.onSignal} /></View>
            <Text style={s.brandText}>VanEscolar</Text>
          </View>
          <TouchableScale onPress={() => go('entrar')} accessibilityLabel="Pular apresentação" style={s.skip}>
            <Text style={s.skipText}>Pular</Text>
          </TouchableScale>
        </View>

        <Animated.ScrollView
          horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / W))}
          scrollEventThrottle={16}
        >
          {SLIDES.map((sl) => (
            <View key={sl.title} style={{ width: W, paddingHorizontal: 28 }}>
              <HeroArt icon={sl.icon} tint={sl.tint} />
              <Text style={s.slideTitle} accessibilityRole="header">{sl.title}</Text>
              <Text style={s.slideText}>{sl.text}</Text>
            </View>
          ))}
        </Animated.ScrollView>

        <View style={s.dots} accessibilityLabel={`Página ${page + 1} de ${SLIDES.length}`}>
          {SLIDES.map((_, i) => {
            const w = scrollX.interpolate({ inputRange: [(i - 1) * W, i * W, (i + 1) * W], outputRange: [8, 24, 8], extrapolate: 'clamp' });
            const o = scrollX.interpolate({ inputRange: [(i - 1) * W, i * W, (i + 1) * W], outputRange: [0.25, 1, 0.25], extrapolate: 'clamp' });
            return <Animated.View key={i} style={[s.dot, { width: w, opacity: o }]} />;
          })}
        </View>

        <View style={s.cta}>
          <Button size="lg" label="Criar conta" onPress={() => go('perfil')} />
          <Button size="lg" variant="bordered" label="Já tenho conta" onPress={() => go('entrar')} />
          <TouchableScale onPress={() => entrarDemo('RESPONSAVEL')} style={s.demo} accessibilityRole="button">
            <Text style={s.demoText}>Explorar com dados de exemplo</Text>
          </TouchableScale>
        </View>
      </SafeAreaView>
    );
  }

  /* ------------------ Demais passos ------------------ */
  const voltar = () => go(step === 'cadastro' ? 'perfil' : step === 'confirmar' ? 'entrar' : 'boasvindas', -1);

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.topRow}>
          <TouchableScale onPress={voltar} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Voltar">
            <Icon name="chevronLeft" size={20} color={colors.label} weight="semibold" />
          </TouchableScale>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.formScroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={slide}>
            {!disponivel && step !== 'perfil' && (
              <View style={{ marginBottom: 16 }}>
                <Notice tone="info" message="O servidor ainda não está configurado neste app. Use “Explorar com dados de exemplo” na tela inicial ou preencha o arquivo .env." />
              </View>
            )}

            {step === 'perfil' && (
              <>
                <Text style={s.h1} accessibilityRole="header">Como você vai usar o app?</Text>
                <Text style={s.sub}>Isso define o que aparece para você. Dá para ter outra conta depois.</Text>
                <View style={{ gap: 12, marginTop: 24 }}>
                  {PAPEIS.map((p) => {
                    const on = tipo === p.tipo;
                    return (
                      <TouchableScale
                        key={p.tipo}
                        onPress={() => setTipo(p.tipo)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: on }}
                        style={[s.role, on && s.roleOn]}
                      >
                        <View style={[s.roleIcon, on && { backgroundColor: colors.primary }]}>
                          <Icon name={p.icon} size={22} color={on ? colors.onPrimary : colors.secondaryLabel} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.roleTitle}>{p.titulo}</Text>
                          <Text style={s.roleText}>{p.texto}</Text>
                        </View>
                        <Icon name={on ? 'checkCircle' : 'circle'} size={24} color={on ? colors.primary : colors.opaqueSeparator} />
                      </TouchableScale>
                    );
                  })}
                </View>
              </>
            )}

            {step === 'cadastro' && (
              <>
                <Text style={s.h1} accessibilityRole="header">Crie sua conta</Text>
                <Text style={s.sub}>Leva menos de um minuto.</Text>
                <View style={s.form}>
                  <TextField label="Nome completo" value={nome} onChangeText={setNome} error={campoErro.nome} icon="person"
                    autoCapitalize="words" autoComplete="name" textContentType="name" returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()} />
                  <TextField label="E-mail" value={email} onChangeText={setEmail} error={campoErro.email} icon="mail"
                    keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email"
                    textContentType="emailAddress" returnKeyType="next" inputRef={emailRef}
                    onSubmitEditing={() => senhaRef.current?.focus()} />
                  <TextField label="Senha" value={senha} onChangeText={setSenha} error={campoErro.senha} icon="lock"
                    secureTextEntry autoCapitalize="none" autoComplete="new-password" textContentType="newPassword"
                    helper="Mínimo de 6 caracteres" returnKeyType="done" inputRef={senhaRef} onSubmitEditing={onCadastrar} />
                  {erro && <Notice tone="error" message={erro} />}
                </View>
                <Text style={s.legal}>Ao continuar você concorda com o tratamento dos seus dados e dos dados do aluno conforme a LGPD.</Text>
              </>
            )}

            {step === 'entrar' && (
              <>
                <Text style={s.h1} accessibilityRole="header">Que bom te ver de novo</Text>
                <Text style={s.sub}>Entre para acompanhar a van.</Text>
                <View style={s.form}>
                  <TextField label="E-mail" value={email} onChangeText={setEmail} error={campoErro.email} icon="mail"
                    keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email"
                    textContentType="emailAddress" returnKeyType="next" inputRef={emailRef}
                    onSubmitEditing={() => senhaRef.current?.focus()} />
                  <TextField label="Senha" value={senha} onChangeText={setSenha} error={campoErro.senha} icon="lock"
                    secureTextEntry autoCapitalize="none" autoComplete="current-password" textContentType="password"
                    returnKeyType="go" inputRef={senhaRef} onSubmitEditing={onEntrar} />
                  {erro && <Notice tone="error" message={erro} />}
                  <TouchableScale onPress={() => go('recuperar')} style={{ alignSelf: 'flex-end', minHeight: 36, justifyContent: 'center' }} accessibilityRole="button">
                    <Text style={s.link}>Esqueci a senha</Text>
                  </TouchableScale>
                </View>
              </>
            )}

            {step === 'recuperar' && (
              <>
                <Text style={s.h1} accessibilityRole="header">Redefinir senha</Text>
                <Text style={s.sub}>Enviaremos um link para o seu e-mail.</Text>
                <View style={s.form}>
                  <TextField label="E-mail" value={email} onChangeText={setEmail} error={campoErro.email} icon="mail"
                    keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email"
                    textContentType="emailAddress" returnKeyType="send" onSubmitEditing={onRecuperar} />
                  {erro && <Notice tone="error" message={erro} />}
                  {info && <Notice tone="success" message={info} />}
                </View>
              </>
            )}

            {step === 'confirmar' && (
              <View style={{ alignItems: 'center', paddingTop: 24 }}>
                <HeroArt icon="mailOpen" tint={colors.successContainer} />
                <Text style={[s.h1, { textAlign: 'center' }]} accessibilityRole="header">Confirme seu e-mail</Text>
                <Text style={[s.sub, { textAlign: 'center' }]}>
                  Enviamos um link para {email.trim()}. Toque nele e depois volte aqui para entrar.
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <View style={s.footer}>
          {step === 'perfil' && <Button size="lg" label="Continuar" onPress={() => go('cadastro')} />}
          {step === 'cadastro' && (
            <>
              <Button size="lg" label="Criar conta" onPress={onCadastrar} loading={loading} disabled={!disponivel} />
              <TouchableScale onPress={() => go('entrar')} style={s.demo}><Text style={s.demoText}>Já tenho conta</Text></TouchableScale>
            </>
          )}
          {step === 'entrar' && (
            <>
              <Button size="lg" label="Entrar" onPress={onEntrar} loading={loading} disabled={!disponivel} />
              <TouchableScale onPress={() => go('perfil')} style={s.demo}><Text style={s.demoText}>Criar uma conta</Text></TouchableScale>
            </>
          )}
          {step === 'recuperar' && <Button size="lg" label="Enviar link" onPress={onRecuperar} loading={loading} disabled={!disponivel} />}
          {step === 'confirmar' && <Button size="lg" label="Ir para o login" onPress={() => go('entrar')} />}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const art = StyleSheet.create({
  wrap: { height: 280, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  ring: { position: 'absolute', borderRadius: 999 },
  core: { width: 112, height: 112, borderRadius: radius.xl, borderCurve: 'continuous', backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center', ...elevation.e2 },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.groupedBg },
  topRow: { height: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandIcon: { width: 30, height: 30, borderRadius: radius.sm, backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center' },
  brandText: { ...type.headline, color: colors.label },
  skip: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  skipText: { ...type.callout, color: colors.secondaryLabel },
  slideTitle: { ...type.title1, color: colors.label, textAlign: 'center', marginTop: 8 },
  slideText: { ...type.body, color: colors.secondaryLabel, textAlign: 'center', marginTop: 10 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 22 },
  dot: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  cta: { marginTop: 'auto', paddingHorizontal: 22, paddingBottom: 18, gap: 10 },
  demo: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  demoText: { ...type.callout, color: colors.secondaryLabel },
  backBtn: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.fill3 },
  formScroll: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 24 },
  h1: { ...type.largeTitle, color: colors.label },
  sub: { ...type.body, color: colors.secondaryLabel, marginTop: 6 },
  form: { gap: 16, marginTop: 24 },
  link: { ...type.callout, fontWeight: '600', color: colors.primaryInk },
  legal: { ...type.footnote, color: colors.secondaryLabel, marginTop: 18 },
  footer: { paddingHorizontal: 22, paddingBottom: Platform.OS === 'ios' ? 8 : 18, paddingTop: 8, gap: 4 },
  role: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: colors.secondaryGroupedBg,
    borderRadius: radius.lg, borderCurve: 'continuous', borderWidth: 1.5, borderColor: 'transparent', ...elevation.e1,
  },
  roleOn: { borderColor: colors.primary },
  roleIcon: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.fill3, alignItems: 'center', justifyContent: 'center' },
  roleTitle: { ...type.headline, color: colors.label },
  roleText: { ...type.footnote, color: colors.secondaryLabel, marginTop: 2 },
});
