import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Mensalidade, MetodoPagamento } from '../types/database';
import { SecurityService } from '../services/security';
import { useApp } from '../context/AppContext';
import { AppleButton } from './AppleButton';

interface PaymentModalProps {
  visible: boolean;
  mensalidade: Mensalidade | null;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  mensalidade,
  onClose,
}) => {
  const { pagarMensalidade } = useApp();
  const [metodo, setMetodo] = useState<MetodoPagamento>('PIX');
  const [loading, setLoading] = useState(false);
  const [reciboHash, setReciboHash] = useState<string | null>(null);

  const [cartaoNumero, setCartaoNumero] = useState('4532 8901 2345 6789');
  const [cartaoNome, setCartaoNome] = useState('CARLOS E SILVA');
  const [cartaoValidade, setCartaoValidade] = useState('11/29');
  const [cartaoCvv, setCartaoCvv] = useState('789');

  if (!mensalidade) return null;

  const pixCopiaCola =
    '00020126580014br.gov.bcb.pix0136marcos.transporte@escolar.com.br5204000053039865405420.005802BR5920MARCOS TIO TRANSPORTE6009SAO PAULO62070503***6304E8A2';

  const boletoLinha = '23793.38128 60000.123456 01000.654321 8 98760000042000';

  const handleCopiarPix = () => {
    Alert.alert('Copiado', 'Código PIX Copia e Cola copiado para a área de transferência.');
  };

  const handleCopiarBoleto = () => {
    Alert.alert('Copiado', 'Linha digitável do Boleto copiada com sucesso.');
  };

  const handleFinalizar = async () => {
    setLoading(true);
    try {
      const res = await pagarMensalidade(mensalidade.id, metodo, {
        metodo,
        detalhes: metodo === 'CARTAO' ? { ultimosDigitos: cartaoNumero.slice(-4) } : {},
      });

      if (res.sucesso && res.reciboHash) {
        setReciboHash(res.reciboHash);
      } else {
        handleClose();
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível processar o pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReciboHash(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          {/* Indicador de puxar Apple */}
          <View style={styles.dragPill} />

          {/* Cabeçalho */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {reciboHash ? 'Comprovante Digital' : 'Liquidação de Mensalidade'}
              </Text>
              <Text style={styles.subtitle}>
                Referência: {mensalidade.mes_referencia}/{mensalidade.ano_referencia} •{' '}
                {SecurityService.formatCurrency(mensalidade.valor)}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeCircle}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {reciboHash ? (
              /* Recibo no Estilo Ticket Apple Wallet */
              <View style={styles.ticketCard}>
                <View style={styles.ticketCheck}>
                  <View style={styles.checkBubble}>
                    <Ionicons name="checkmark" size={24} color={colors.systemGreen} />
                  </View>
                  <Text style={styles.ticketStatus}>Pagamento Confirmado</Text>
                  <Text style={styles.ticketHash}>{reciboHash}</Text>
                </View>

                <View style={styles.ticketDivider} />

                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Transportador:</Text>
                  <Text style={styles.ticketVal}>Marcos Oliveira (Tio Marcos)</Text>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Alvará Municipal:</Text>
                  <Text style={styles.ticketVal}>AUT-9874/2026</Text>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Responsável:</Text>
                  <Text style={styles.ticketVal}>Carlos Eduardo Silva</Text>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Aluno:</Text>
                  <Text style={styles.ticketVal}>Lucas Silva (5º Ano B)</Text>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Método Utilizado:</Text>
                  <Text style={styles.ticketVal}>{metodo}</Text>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Data e Hora:</Text>
                  <Text style={styles.ticketVal}>
                    {SecurityService.formatDate(new Date().toISOString(), true)}
                  </Text>
                </View>

                <View style={styles.ticketTotalBox}>
                  <Text style={styles.ticketTotalLabel}>Total Liquidado</Text>
                  <Text style={styles.ticketTotalValue}>
                    {SecurityService.formatCurrency(mensalidade.valor)}
                  </Text>
                </View>

                <AppleButton
                  variant="primary"
                  title="Concluir e Fechar"
                  onPress={handleClose}
                  style={{ marginTop: 18 }}
                  size="lg"
                />
              </View>
            ) : (
              <>
                {/* Segmented Control iOS para Escolha do Método */}
                <View style={styles.segmentedControl}>
                  <TouchableOpacity
                    style={[styles.segmentBtn, metodo === 'PIX' && styles.segmentBtnActive]}
                    onPress={() => setMetodo('PIX')}
                  >
                    <Ionicons
                      name="flash"
                      size={14}
                      color={metodo === 'PIX' ? colors.textPrimary : colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.segmentText,
                        metodo === 'PIX' && styles.segmentTextActive,
                      ]}
                    >
                      PIX
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.segmentBtn, metodo === 'CARTAO' && styles.segmentBtnActive]}
                    onPress={() => setMetodo('CARTAO')}
                  >
                    <Ionicons
                      name="card"
                      size={14}
                      color={metodo === 'CARTAO' ? colors.textPrimary : colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.segmentText,
                        metodo === 'CARTAO' && styles.segmentTextActive,
                      ]}
                    >
                      Cartão
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.segmentBtn, metodo === 'BOLETO' && styles.segmentBtnActive]}
                    onPress={() => setMetodo('BOLETO')}
                  >
                    <Ionicons
                      name="barcode"
                      size={14}
                      color={metodo === 'BOLETO' ? colors.textPrimary : colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.segmentText,
                        metodo === 'BOLETO' && styles.segmentTextActive,
                      ]}
                    >
                      Boleto
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Conteúdo PIX */}
                {metodo === 'PIX' && (
                  <View style={styles.methodBox}>
                    <View style={styles.qrCodeCard}>
                      <View style={styles.qrPlaceholder}>
                        <Ionicons name="qr-code" size={110} color={colors.textPrimary} />
                      </View>
                      <Text style={styles.qrTimer}>Expira em 14:59 min</Text>
                    </View>

                    <Text style={styles.inputLabel}>Chave PIX Copia e Cola:</Text>
                    <View style={styles.copyPill}>
                      <Text style={styles.copyString} numberOfLines={1}>
                        {pixCopiaCola}
                      </Text>
                      <AppleButton
                        variant="tonal"
                        title="Copiar"
                        size="sm"
                        icon={<Ionicons name="copy-outline" size={13} color={colors.accentText} />}
                        onPress={handleCopiarPix}
                      />
                    </View>
                  </View>
                )}

                {/* Conteúdo Cartão de Crédito */}
                {metodo === 'CARTAO' && (
                  <View style={styles.methodBox}>
                    {/* Cartão Estilo Apple Wallet */}
                    <View style={styles.walletCard}>
                      <View style={styles.walletTop}>
                        <Text style={styles.walletBrand}>VAN ESCUDO</Text>
                        <Ionicons name="wifi" size={18} color="rgba(255, 255, 255, 0.7)" />
                      </View>
                      <Text style={styles.walletNumber}>{cartaoNumero}</Text>
                      <View style={styles.walletBottom}>
                        <View>
                          <Text style={styles.walletSub}>TITULAR</Text>
                          <Text style={styles.walletVal}>{cartaoNome}</Text>
                        </View>
                        <View>
                          <Text style={styles.walletSub}>VALIDADE</Text>
                          <Text style={styles.walletVal}>{cartaoValidade}</Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.inputLabel}>Número do Cartão:</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={cartaoNumero}
                      onChangeText={setCartaoNumero}
                      keyboardType="numeric"
                    />

                    <View style={styles.twoCols}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Validade:</Text>
                        <TextInput
                          style={styles.fieldInput}
                          value={cartaoValidade}
                          onChangeText={setCartaoValidade}
                          placeholder="MM/AA"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>CVV:</Text>
                        <TextInput
                          style={styles.fieldInput}
                          value={cartaoCvv}
                          onChangeText={setCartaoCvv}
                          keyboardType="numeric"
                          secureTextEntry
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* Conteúdo Boleto */}
                {metodo === 'BOLETO' && (
                  <View style={styles.methodBox}>
                    <View style={styles.barcodeCard}>
                      <Ionicons name="barcode-outline" size={70} color={colors.textPrimary} />
                      <Text style={styles.barcodeExpiry}>
                        Vencimento: {SecurityService.formatDate(mensalidade.data_vencimento)}
                      </Text>
                    </View>

                    <Text style={styles.inputLabel}>Linha Digitável:</Text>
                    <View style={styles.copyPill}>
                      <Text style={styles.copyString} numberOfLines={1}>
                        {boletoLinha}
                      </Text>
                      <AppleButton
                        variant="tonal"
                        title="Copiar"
                        size="sm"
                        icon={<Ionicons name="copy-outline" size={13} color={colors.accentText} />}
                        onPress={handleCopiarBoleto}
                      />
                    </View>
                  </View>
                )}

                <AppleButton
                  variant="primary"
                  title={
                    loading
                      ? 'Processando...'
                      : `Confirmar Pagamento (${SecurityService.formatCurrency(mensalidade.valor)})`
                  }
                  icon={<Ionicons name="shield-checkmark" size={16} color="#FFF" />}
                  onPress={handleFinalizar}
                  disabled={loading}
                  size="lg"
                  style={{ marginTop: 14 }}
                />
              </>
            )}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  dragPill: {
    width: 36,
    height: 5,
    backgroundColor: colors.systemGray5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  closeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.systemGray6,
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
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
  },
  segmentTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  methodBox: {
    marginBottom: 12,
  },
  qrCodeCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  qrPlaceholder: {
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  qrTimer: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accentDark,
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 5,
    marginLeft: 2,
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  copyString: {
    flex: 1,
    fontSize: 12,
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  walletCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  walletTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  walletBrand: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  walletNumber: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 16,
  },
  walletBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  walletSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontWeight: '600',
  },
  walletVal: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  fieldInput: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  twoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  barcodeCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  barcodeExpiry: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 4,
  },
  ticketCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    padding: 18,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  ticketCheck: {
    alignItems: 'center',
    marginVertical: 10,
  },
  checkBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.systemGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketStatus: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
    letterSpacing: -0.2,
  },
  ticketHash: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  ticketDivider: {
    height: 0.5,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  ticketLabel: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  ticketVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ticketTotalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.accentUltraLight,
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 0.5,
    borderColor: colors.accentLight,
  },
  ticketTotalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accentText,
  },
  ticketTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.accentText,
  },
});
