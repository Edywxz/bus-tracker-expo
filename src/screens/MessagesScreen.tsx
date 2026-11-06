import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
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

const listar = (n: string[]) => (n.length < 2 ? n.join('') : `${n.slice(0, -1).join(', ')} e ${n[n.length - 1]}`);
const ORIGEM: Record<string, string> = { MOTORISTA: 'Motorista', PAIS: 'Responsável' };

/* ------------------------------------------------------------------ Recados (alertas + atalho da conversa) */
export const MessagesScreen: React.FC = () => {
  const { notificacoes, mensagensChat, marcarNotificacoesComoLidas, role, isDemo, alunos, recarregar } = useApp();
  const naoLidas = notificacoes.filter((n) => !n.lida).length;
  const semCanal = !isDemo && role !== 'TRANSPORTADOR' && alunos.length === 0;
  const motorista = role === 'TRANSPORTADOR';
  const ultima = mensagensChat[mensagensChat.length - 1];
  // Motorista: uma conversa privada por responsável (nunca um grupo).
  const conversas = motorista ? Array.from(alunos.reduce((m, a) => {
    m.set(a.responsavel_id, [...(m.get(a.responsavel_id) ?? []), a.nome.split(' ')[0]]); return m;
  }, new Map<string, string[]>())).map(([id, filhos]) => {
    const ult = [...mensagensChat].reverse().find((x) => x.responsavelId === id);
    return { id, titulo: `Responsável de ${listar(filhos)}`, ult };
  }) : [];

  return (
    <Screen title="Recados" onRefresh={recarregar}
      headerRight={naoLidas > 0 ? <HeaderButton label="Marcar lidas" onPress={() => marcarNotificacoesComoLidas().catch(() => {})} /> : undefined}>
      <SectionHeader title="Conversa" />
      <ListSection>
        {motorista ? (
          conversas.length === 0 ? (
            <ListRow leading={<IconTile name="messages" tone="primary" />} title="Nenhum responsável vinculado" subtitle="Quando um responsável usar o seu código, a conversa aparece aqui." disabled />
          ) : conversas.map((c) => (
            <ListRow
              key={c.id}
              leading={<IconTile name="messages" tone="primary" />}
              title={c.titulo}
              subtitle={c.ult ? c.ult.texto : 'Conversa privada.'}
              subtitleLines={2}
              onPress={() => router.push({ pathname: '/conversa', params: { responsavelId: c.id, titulo: c.titulo } })}
            />
          ))
        ) : (
          <ListRow
            leading={<IconTile name="messages" tone="primary" />}
            title="Conversa com o motorista"
            subtitle={semCanal ? 'Cadastre um dependente para conversar com o motorista.'
              : ultima ? `${ultima.remetenteNome}: ${ultima.texto}` : 'Conversa privada entre você e o motorista.'}
            subtitleLines={2}
            disabled={semCanal}
            onPress={() => router.push('/conversa')}
          />
        )}
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
  const { mensagensChat: todas, enviarMensagem, role, perfil, isDemo, alunos } = useApp();
  const { responsavelId, titulo } = useLocalSearchParams<{ responsavelId?: string; titulo?: string }>();
  // O motorista vê só a conversa do responsável escolhido; o responsável recebe do banco apenas a sua.
  const mensagensChat = role === 'TRANSPORTADOR' ? todas.filter((m) => m.responsavelId === responsavelId) : todas;
  const insets = useSafeAreaInsets();
  const [texto, setTexto] = useState('');
  const [sending, setSending] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const meuOrigem = role === 'TRANSPORTADOR' ? 'MOTORISTA' : 'PAIS';
  const semCanal = !isDemo && role !== 'TRANSPORTADOR' && alunos.length === 0;

  useEffect(() => { setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60); }, [mensagensChat.length]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t || sending) return;
    setSending(true); setErro(null);
    try { await enviarMensagem(t, responsavelId); setTexto(''); } catch (e) { setErro(mensagemErro(e)); } finally { setSending(false); }
  };
  const podeEnviar = !!texto.trim() && !sending;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.systemBg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: role === 'TRANSPORTADOR' ? titulo ?? 'Conversa' : 'Conversa com o motorista' }} />
      <ScrollView ref={scroll} style={{ flex: 1 }} contentInsetAdjustmentBehavior="automatic" keyboardDismissMode="interactive"
        contentContainerStyle={c.list}>
        {semCanal ? (
          <EmptyState icon="messages" title="Conversa indisponível" message="Cadastre um dependente com o código do motorista para conversar com ele." />
        ) : mensagensChat.length === 0 ? (
          <EmptyState icon="chat" title="Comece a conversa" message={role === 'TRANSPORTADOR' ? 'Esta conversa é privada: só você e este responsável leem as mensagens.' : 'Esta conversa é privada: só você e o motorista leem as mensagens.'} />
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
