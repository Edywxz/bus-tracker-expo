import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { gap, layout, radius, spacing } from '../theme/tokens';
import { type } from '../theme/type';
import { FadeInUp } from '../components/ui/FadeInUp';
import {
  Badge, EmptyState, GlassSurface, HeaderButton, Icon, IconName, IconTile, IconTone, ListRow, ListSection, MessageBubble, Notice,
  PressableScale, Screen, SectionHeader,
} from '../components/ui/kit';
import { useApp } from '../context/AppContext';
import { horaCurta, mensagemErro, semEmoji, tempoRelativo } from '../utils/format';

const TIPO: Record<string, { icon: IconName; tone: IconTone }> = {
  CHEGANDO: { icon: 'van', tone: 'signal' },
  EMBARQUE: { icon: 'checkCircle', tone: 'success' },
  PAGAMENTO: { icon: 'card', tone: 'info' },
  EMERGENCIA: { icon: 'warning', tone: 'error' },
  AVISO: { icon: 'megaphone', tone: 'gray' },
};

const ORIGEM: Record<string, string> = { MOTORISTA: 'Motorista', PAIS: 'Família', ESCOLA: 'Escola' };

/* ------------------------------------------------------------------ Recados (alertas + atalho da conversa) */
export const MessagesScreen: React.FC = () => {
  const { notificacoes, mensagensChat, marcarNotificacoesComoLidas, role, isDemo, alunos, recarregar } = useApp();
  const naoLidas = notificacoes.filter((n) => !n.lida).length;
  const semCanal = !isDemo && role !== 'TRANSPORTADOR' && alunos.length === 0;
  const ultima = mensagensChat[mensagensChat.length - 1];

  return (
    <Screen title="Recados" onRefresh={recarregar}
      headerRight={naoLidas > 0 ? <HeaderButton label="Marcar lidas" onPress={() => marcarNotificacoesComoLidas().catch(() => {})} /> : undefined}>
      <SectionHeader title="Conversa" />
      <ListSection>
        <ListRow
          leading={<IconTile name="messages" tone="primary" />}
          title="Conversa da rota"
          subtitle={semCanal ? 'Cadastre um aluno para conversar com o motorista e a escola.'
            : ultima ? `${ultima.remetenteNome}: ${ultima.texto}` : 'Motorista, famílias e escola da mesma rota.'}
          subtitleLines={2}
          disabled={semCanal}
          onPress={() => router.push('/conversa')}
        />
      </ListSection>

      <SectionHeader title={naoLidas ? `Alertas · ${naoLidas} novos` : 'Alertas'} />
      {notificacoes.length === 0 ? (
        <EmptyState icon="bellOff" title="Nada por aqui" message="Avisos de embarque, chegada da van, pagamentos e ocorrências aparecem neste lugar." />
      ) : (
        <FadeInUp>
          <ListSection>
            {notificacoes.map((n) => {
              const t = TIPO[n.tipo] ?? TIPO.AVISO;
              return (
                <ListRow
                  key={n.id}
                  icon={t.icon}
                  iconTone={t.tone}
                  title={semEmoji(n.titulo)}
                  subtitle={`${n.mensagem} · ${tempoRelativo(n.dataHora)}`}
                  subtitleLines={4}
                  trailing={!n.lida ? <Badge dot /> : undefined}
                  accessibilityLabel={`${n.lida ? '' : 'Não lida. '}${semEmoji(n.titulo)}. ${n.mensagem}. ${tempoRelativo(n.dataHora)}`}
                />
              );
            })}
          </ListSection>
        </FadeInUp>
      )}
    </Screen>
  );
};

/* ------------------------------------------------------------------ Conversa (empurrada, sem tab bar) */
export const ChatScreen: React.FC = () => {
  const { mensagensChat, enviarMensagem, role, perfil, isDemo, alunos } = useApp();
  const insets = useSafeAreaInsets();
  const [texto, setTexto] = useState('');
  const [sending, setSending] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const meuOrigem = role === 'TRANSPORTADOR' ? 'MOTORISTA' : role === 'INSTITUICAO' ? 'ESCOLA' : 'PAIS';
  const semCanal = !isDemo && role !== 'TRANSPORTADOR' && alunos.length === 0;

  useEffect(() => { setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60); }, [mensagensChat.length]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t || sending) return;
    setSending(true); setErro(null);
    try { await enviarMensagem(t); setTexto(''); } catch (e) { setErro(mensagemErro(e)); } finally { setSending(false); }
  };
  const podeEnviar = !!texto.trim() && !sending;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.systemBg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: 'Conversa da rota' }} />
      <ScrollView ref={scroll} style={{ flex: 1 }} contentInsetAdjustmentBehavior="automatic" keyboardDismissMode="interactive"
        contentContainerStyle={c.list}>
        {semCanal ? (
          <EmptyState icon="messages" title="Conversa indisponível" message="Cadastre um aluno com o código do motorista para conversar com ele e com a escola." />
        ) : mensagensChat.length === 0 ? (
          <EmptyState icon="chat" title="Comece a conversa" message="Mensagens aqui são visíveis para o motorista, as famílias e a escola ligados à mesma rota." />
        ) : (
          mensagensChat.map((m) => {
            const meu = m.origem === meuOrigem && (isDemo || m.remetenteId === perfil?.id);
            return (
              <MessageBubble key={m.id} kind={meu ? 'out' : 'in'} text={m.texto}
                sender={meu ? undefined : `${m.remetenteNome} · ${ORIGEM[m.origem] ?? ''}`} meta={horaCurta(m.dataHora)} />
            );
          })
        )}
      </ScrollView>
      {erro && <View style={{ paddingHorizontal: layout.gutter, paddingBottom: spacing.s6 }}><Notice tone="error" message={erro} /></View>}
      {!semCanal && (
        <GlassSurface material="chrome" floating={false} style={{ borderRadius: 0 }}>
          <View style={[c.composer, { paddingBottom: Math.max(insets.bottom, spacing.sm) + spacing.xs }]}>
            <TextInput
              value={texto} onChangeText={setTexto} placeholder="Mensagem" placeholderTextColor={colors.tertiaryLabel}
              style={c.input} multiline maxLength={500} accessibilityLabel="Escrever mensagem" cursorColor={colors.primary}
            />
            <PressableScale onPress={enviar} disabled={!podeEnviar} hitSlop={6} style={[c.send, !podeEnviar && { backgroundColor: colors.fill1 }]}
              accessibilityRole="button" accessibilityLabel="Enviar">
              <Icon name="arrowUp" size={18} color={podeEnviar ? colors.onPrimary : colors.secondaryLabel} weight="bold" />
            </PressableScale>
          </View>
        </GlassSurface>
      )}
    </KeyboardAvoidingView>
  );
};

const c = StyleSheet.create({
  list: { paddingHorizontal: layout.gutter, paddingVertical: spacing.md, gap: gap.related, flexGrow: 1 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  input: {
    flex: 1, minHeight: 36, maxHeight: 120, backgroundColor: colors.systemBg, borderRadius: 18, paddingHorizontal: spacing.md + 2,
    paddingTop: Platform.OS === 'ios' ? 8 : 6, paddingBottom: Platform.OS === 'ios' ? 8 : 6, ...type.body, color: colors.label,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.opaqueSeparator,
  },
  send: { width: 36, height: 36, marginBottom: 0, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
