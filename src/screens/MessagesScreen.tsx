import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { radius, shadows } from '../theme/tokens';
import { type } from '../theme/type';
import { TouchableScale } from '../components/ui/TouchableScale';
import { FadeInUp } from '../components/ui/FadeInUp';
import { Banner, EmptyState, Group, IconTile, Segmented } from '../components/ui/kit';
import { useApp } from '../context/AppContext';
import { horaCurta, mensagemErro, semEmoji, tempoRelativo } from '../utils/format';

type Aba = 'ALERTAS' | 'CONVERSA';

const TIPO: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  CHEGANDO: { icon: 'navigate', color: colors.accentDark, bg: colors.accentLight },
  EMBARQUE: { icon: 'checkmark-circle', color: colors.systemGreenText, bg: colors.systemGreenLight },
  PAGAMENTO: { icon: 'card', color: colors.systemBlueText, bg: colors.systemBlueLight },
  EMERGENCIA: { icon: 'warning', color: colors.systemRedText, bg: colors.systemRedLight },
  AVISO: { icon: 'megaphone', color: colors.textSecondary, bg: colors.background },
};

const ORIGEM: Record<string, { label: string; color: string }> = {
  MOTORISTA: { label: 'Motorista', color: colors.accentDark },
  PAIS: { label: 'Família', color: colors.systemBlueText },
  ESCOLA: { label: 'Escola', color: '#7A2FA6' },
};

export const MessagesScreen: React.FC = () => {
  const { notificacoes, mensagensChat, marcarNotificacoesComoLidas, enviarMensagem, role, perfil, isDemo, alunos } = useApp();
  const [aba, setAba] = useState<Aba>('ALERTAS');
  const [texto, setTexto] = useState('');
  const [sending, setSending] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const scroll = useRef<any>(null);
  const naoLidas = notificacoes.filter((n) => !n.lida).length;
  const meuOrigem = role === 'TRANSPORTADOR' ? 'MOTORISTA' : role === 'INSTITUICAO' ? 'ESCOLA' : 'PAIS';
  const semCanal = !isDemo && role !== 'TRANSPORTADOR' && alunos.length === 0;

  useEffect(() => { if (aba === 'CONVERSA') setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60); }, [aba, mensagensChat.length]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t || sending) return;
    setSending(true); setErro(null);
    try { await enviarMensagem(t); setTexto(''); } catch (e) { setErro(mensagemErro(e)); } finally { setSending(false); }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
      <View style={s.head}>
        <Text style={s.title} accessibilityRole="header">Recados</Text>
        {aba === 'ALERTAS' && naoLidas > 0 && (
          <TouchableScale onPress={() => marcarNotificacoesComoLidas().catch(() => {})} style={s.markAll} accessibilityRole="button">
            <Text style={s.markAllText}>Marcar como lidas</Text>
          </TouchableScale>
        )}
      </View>
      <View style={{ paddingHorizontal: 18, paddingBottom: 12 }}>
        <Segmented<Aba> value={aba} onChange={setAba}
          options={[{ value: 'ALERTAS', label: 'Alertas', badge: naoLidas }, { value: 'CONVERSA', label: 'Conversa' }]} />
      </View>

      {aba === 'ALERTAS' ? (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {notificacoes.length === 0 ? (
            <EmptyState icon="notifications-off" title="Nada por aqui" message="Avisos de embarque, chegada da van, pagamentos e ocorrências aparecem neste lugar." />
          ) : (
            <FadeInUp>
              <Group>
                {notificacoes.map((n) => {
                  const t = TIPO[n.tipo] ?? TIPO.AVISO;
                  return (
                    <View key={n.id} style={s.item} accessible accessibilityLabel={`${n.lida ? '' : 'Não lida. '}${semEmoji(n.titulo)}. ${n.mensagem}`}>
                      <IconTile name={t.icon} color={t.color} bg={t.bg} />
                      <View style={{ flex: 1 }}>
                        <View style={s.itemTop}>
                          <Text style={[s.itemTitle, !n.lida && { fontWeight: '800' }]} numberOfLines={1}>{semEmoji(n.titulo)}</Text>
                          <Text style={s.time}>{tempoRelativo(n.dataHora)}</Text>
                        </View>
                        <Text style={s.itemMsg}>{n.mensagem}</Text>
                      </View>
                      {!n.lida && <View style={s.unread} />}
                    </View>
                  );
                })}
              </Group>
            </FadeInUp>
          )}
        </ScrollView>
      ) : (
        <>
          <ScrollView ref={scroll} contentContainerStyle={[s.list, { gap: 10 }]} showsVerticalScrollIndicator={false} keyboardDismissMode="interactive">
            {semCanal ? (
              <EmptyState icon="chatbubbles" title="Conversa indisponível" message="Cadastre um aluno com o código do motorista para conversar com ele e com a escola." />
            ) : mensagensChat.length === 0 ? (
              <EmptyState icon="chatbubble-ellipses" title="Comece a conversa" message="Mensagens aqui são visíveis para o motorista, as famílias e a escola ligados à mesma rota." />
            ) : (
              mensagensChat.map((m) => {
                const meu = m.origem === meuOrigem && (isDemo || m.remetenteId === perfil?.id);
                const o = ORIGEM[m.origem];
                return (
                  <View key={m.id} style={[s.bubbleRow, meu && { justifyContent: 'flex-end' }]}>
                    <View style={[s.bubble, meu ? s.mine : s.theirs]}>
                      {!meu && <Text style={[s.sender, { color: o?.color }]}>{m.remetenteNome} · {o?.label}</Text>}
                      <Text style={[s.bubbleText, meu && { color: '#fff' }]}>{m.texto}</Text>
                      <Text style={[s.bubbleTime, meu && { color: 'rgba(255,255,255,0.6)' }]}>{horaCurta(m.dataHora)}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
          {erro && <View style={{ paddingHorizontal: 18, paddingBottom: 6 }}><Banner tone="error" message={erro} /></View>}
          {!semCanal && (
            <View style={s.composer}>
              <TextInput
                value={texto} onChangeText={setTexto} placeholder="Mensagem" placeholderTextColor={colors.textQuaternary}
                style={s.input} multiline maxLength={500} accessibilityLabel="Escrever mensagem"
              />
              <TouchableScale onPress={enviar} disabled={!texto.trim() || sending} style={[s.send, !texto.trim() && { backgroundColor: colors.borderOpaque }]}
                accessibilityRole="button" accessibilityLabel="Enviar">
                <Ionicons name="arrow-up" size={20} color="#fff" />
              </TouchableScale>
            </View>
          )}
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  head: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  title: { ...type.largeTitle, color: colors.textPrimary },
  markAll: { minHeight: 40, justifyContent: 'center' },
  markAllText: { ...type.footnote, fontWeight: '700', color: colors.accentDark },
  list: { paddingHorizontal: 18, paddingBottom: 24, flexGrow: 1 },
  item: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'flex-start' },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  itemTitle: { flex: 1, ...type.callout, fontWeight: '600', color: colors.textPrimary },
  itemMsg: { ...type.subhead, color: colors.textSecondary, marginTop: 2 },
  time: { ...type.footnote, color: colors.textTertiary },
  unread: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.systemBlue, marginTop: 6 },
  bubbleRow: { flexDirection: 'row' },
  bubble: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderCurve: 'continuous' },
  mine: { backgroundColor: colors.ink, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 6, ...shadows.card },
  sender: { ...type.caption, marginBottom: 2 },
  bubbleText: { ...type.body, color: colors.textPrimary },
  bubbleTime: { ...type.caption, fontSize: 10, color: colors.textQuaternary, alignSelf: 'flex-end', marginTop: 3 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: colors.surface, borderRadius: 22, paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 10, paddingBottom: Platform.OS === 'ios' ? 12 : 10, ...type.body, color: colors.textPrimary,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  send: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
});
