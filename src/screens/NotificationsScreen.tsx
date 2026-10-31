import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { SecurityService } from '../services/security';

export const NotificationsScreen: React.FC = () => {
  const {
    role,
    notificacoes,
    mensagensChat,
    enviarMensagem,
    marcarNotificacoesComoLidas,
  } = useApp();
  const [activeTab, setActiveTab] = useState<'NOTIF' | 'CHAT'>('NOTIF');
  const [inputText, setInputText] = useState('');

  const handleEnviar = async () => {
    if (!inputText.trim()) return;
    await enviarMensagem(inputText);
    setInputText('');
  };

  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Segmented Control no Topo */}
      <View style={styles.tabBarWrap}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'NOTIF' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('NOTIF')}
          >
            <Ionicons
              name="notifications-outline"
              size={14}
              color={activeTab === 'NOTIF' ? colors.textPrimary : colors.textTertiary}
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === 'NOTIF' && styles.segmentTextActive,
              ]}
            >
              Alertas
            </Text>
            {unreadCount > 0 && (
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'CHAT' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('CHAT')}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={14}
              color={activeTab === 'CHAT' ? colors.textPrimary : colors.textTertiary}
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === 'CHAT' && styles.segmentTextActive,
              ]}
            >
              Chat Operacional
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo: Alertas Automáticos */}
      {activeTab === 'NOTIF' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markReadRow}
              onPress={marcarNotificacoesComoLidas}
            >
              <Ionicons name="checkmark-done" size={14} color={colors.accentDark} />
              <Text style={styles.markReadText}>Marcar todas como lidas</Text>
            </TouchableOpacity>
          )}

          <View style={styles.notifGroup}>
            {notificacoes.map((n) => {
              const isEmergencia = n.tipo === 'EMERGENCIA';
              const isEmbarque = n.tipo === 'EMBARQUE';

              return (
                <View
                  key={n.id}
                  style={[styles.notifCard, !n.lida && styles.notifCardUnread]}
                >
                  <View style={styles.notifInner}>
                    <View
                      style={[
                        styles.notifIconBubble,
                        {
                          backgroundColor: isEmergencia
                            ? colors.systemRedLight
                            : isEmbarque
                            ? colors.systemGreenLight
                            : colors.accentUltraLight,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          isEmergencia
                            ? 'warning'
                            : isEmbarque
                            ? 'checkmark'
                            : 'bus'
                        }
                        size={17}
                        color={
                          isEmergencia
                            ? colors.systemRed
                            : isEmbarque
                            ? colors.systemGreen
                            : colors.accentDark
                        }
                      />
                    </View>

                    <View style={styles.notifBody}>
                      <View style={styles.notifTitleRow}>
                        <Text style={styles.notifTitle}>{n.titulo}</Text>
                        {!n.lida && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.notifDesc}>{n.mensagem}</Text>
                      <Text style={styles.notifTimestamp}>
                        {SecurityService.formatDate(n.dataHora, true)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Conteúdo: Chat Direto (Estilo iMessage) */}
      {activeTab === 'CHAT' && (
        <View style={styles.chatWrap}>
          <ScrollView
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.encryptedBanner}>
              <Ionicons name="lock-closed" size={11} color={colors.textTertiary} />
              <Text style={styles.encryptedText}>
                Comunicação protegida e direta entre Pais, Motorista e Colégio.
              </Text>
            </View>

            {mensagensChat.map((m) => {
              const isMe =
                (role === 'RESPONSAVEL' && m.origem === 'PAIS') ||
                (role === 'TRANSPORTADOR' && m.origem === 'MOTORISTA') ||
                (role === 'INSTITUICAO' && m.origem === 'ESCOLA');

              return (
                <View
                  key={m.id}
                  style={[
                    styles.messageRow,
                    isMe ? styles.messageRowRight : styles.messageRowLeft,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.bubbleMe : styles.bubbleOther,
                    ]}
                  >
                    {!isMe && (
                      <Text style={styles.bubbleSender}>{m.remetenteNome}</Text>
                    )}
                    <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
                      {m.texto}
                    </Text>
                    <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                      {SecurityService.formatDate(m.dataHora, true)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Barra de Entrada Apple */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.chatTextInput}
              placeholder="Mensagem..."
              placeholderTextColor={colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleEnviar}
              disabled={!inputText.trim()}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-up"
                size={16}
                color={inputText.trim() ? '#FFF' : colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBarWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: colors.surface,
    borderBottomWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderBottomColor: colors.border,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.systemGray6,
    borderRadius: 12,
    padding: 3,
    marginBottom: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: -0.1,
  },
  segmentTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  counterBadge: {
    backgroundColor: colors.systemRed,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  counterText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 36,
  },
  markReadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginBottom: 10,
    paddingRight: 4,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accentDark,
    letterSpacing: -0.1,
  },
  notifGroup: {
    gap: 10,
  },
  notifCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderColor: colors.border,
  },
  notifCardUnread: {
    backgroundColor: '#FFFCF5',
    borderColor: colors.accentLight,
  },
  notifInner: {
    flexDirection: 'row',
    gap: 12,
  },
  notifIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBody: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.accent,
  },
  notifDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 17,
    letterSpacing: -0.1,
  },
  notifTimestamp: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 6,
  },
  chatWrap: {
    flex: 1,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  encryptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 8,
  },
  encryptedText: {
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: -0.1,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: colors.systemBlue,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleSender: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accentDark,
    marginBottom: 3,
  },
  bubbleText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  bubbleTextMe: {
    color: '#FFFFFF',
  },
  bubbleTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
    color: colors.textTertiary,
  },
  bubbleTimeMe: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 90,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.systemBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.systemGray5,
  },
});
