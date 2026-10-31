import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { Mensalidade } from '../types/database';
import { SecurityService } from '../services/security';
import { PaymentModal } from '../components/PaymentModal';
import { ContractModal } from '../components/ContractModal';
import { AppleButton } from '../components/AppleButton';

export const PaymentsScreen: React.FC = () => {
  const { role, mensalidades, contratos } = useApp();
  const [filter, setFilter] = useState<'TODAS' | 'PENDENTES' | 'PAGAS'>('TODAS');
  const [selectedMensalidade, setSelectedMensalidade] = useState<Mensalidade | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [contractModalVisible, setContractModalVisible] = useState(false);

  const totalPendente = mensalidades
    .filter((m) => m.status === 'PENDENTE' || m.status === 'VENCIDO')
    .reduce((acc, cur) => acc + cur.valor, 0);

  const totalPago = mensalidades
    .filter((m) => m.status === 'PAGO')
    .reduce((acc, cur) => acc + cur.valor, 0);

  const filtered = mensalidades.filter((m) => {
    if (filter === 'PENDENTES') return m.status === 'PENDENTE' || m.status === 'VENCIDO';
    if (filter === 'PAGAS') return m.status === 'PAGO';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAGO':
        return { label: 'Pago', bg: colors.systemGreenLight, text: colors.systemGreenText };
      case 'VENCIDO':
        return { label: 'Vencido', bg: colors.systemRedLight, text: colors.systemRedText };
      case 'PENDENTE':
      default:
        return { label: 'Em Aberto', bg: colors.accentUltraLight, text: colors.accentText };
    }
  };

  const getMonthName = (mes: number) => {
    const meses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return meses[mes - 1] || `Mês ${mes}`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Resumo Financeiro Apple Wallet */}
      <View style={styles.walletSummaryCard}>
        <View style={styles.walletHeader}>
          <Text style={styles.walletTitle}>
            {role === 'TRANSPORTADOR' ? 'Faturamento Escolar' : 'Balanço de Mensalidades'}
          </Text>
          <AppleButton
            variant="tonal"
            title="Contrato"
            size="sm"
            icon={<Ionicons name="document-text-outline" size={13} color={colors.accentText} />}
            onPress={() => setContractModalVisible(true)}
          />
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>
              {role === 'TRANSPORTADOR' ? 'A Receber' : 'Pendente'}
            </Text>
            <Text style={[styles.metricValue, { color: colors.accentDark }]}>
              {SecurityService.formatCurrency(totalPendente)}
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>
              {role === 'TRANSPORTADOR' ? 'Recebido no Ano' : 'Pago no Ano'}
            </Text>
            <Text style={[styles.metricValue, { color: colors.systemGreenText }]}>
              {SecurityService.formatCurrency(totalPago)}
            </Text>
          </View>
        </View>
      </View>

      {/* Segmented Control iOS para Filtrar Parcelas */}
      <View style={styles.segmentedControl}>
        {(['TODAS', 'PENDENTES', 'PAGAS'] as const).map((f) => {
          const isSelected = filter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.segmentBtn, isSelected && styles.segmentBtnActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.segmentText,
                  isSelected && styles.segmentTextActive,
                ]}
              >
                {f === 'TODAS' ? 'Todas' : f === 'PENDENTES' ? 'Em Aberto' : 'Liquidadas'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Inset Grouped List de Mensalidades */}
      <View style={styles.invoicesList}>
        {filtered.map((m) => {
          const badge = getStatusBadge(m.status);
          const isPendente = m.status === 'PENDENTE' || m.status === 'VENCIDO';

          return (
            <View key={m.id} style={styles.invoiceCard}>
              <View style={styles.invoiceTop}>
                <View>
                  <Text style={styles.invoiceMonth}>
                    {getMonthName(m.mes_referencia)} • {m.ano_referencia}
                  </Text>
                  <Text style={styles.invoiceDue}>
                    Vencimento: {SecurityService.formatDate(m.data_vencimento)}
                  </Text>
                </View>
                <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.text }]}>
                    {badge.label}
                  </Text>
                </View>
              </View>

              <View style={styles.invoiceBottom}>
                <Text style={styles.invoiceAmount}>
                  {SecurityService.formatCurrency(m.valor)}
                </Text>

                {isPendente ? (
                  <AppleButton
                    variant="primary"
                    title="Pagar Agora"
                    size="sm"
                    icon={<Ionicons name="card" size={14} color="#FFF" />}
                    onPress={() => {
                      setSelectedMensalidade(m);
                      setPaymentModalVisible(true);
                    }}
                  />
                ) : (
                  <AppleButton
                    variant="secondary"
                    title="Recibo"
                    size="sm"
                    icon={<Ionicons name="receipt-outline" size={13} color={colors.textPrimary} />}
                    onPress={() => {
                      setSelectedMensalidade(m);
                      setPaymentModalVisible(true);
                    }}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>

      <PaymentModal
        visible={paymentModalVisible}
        mensalidade={selectedMensalidade}
        onClose={() => {
          setPaymentModalVisible(false);
          setSelectedMensalidade(null);
        }}
      />

      <ContractModal
        visible={contractModalVisible}
        contrato={contratos[0] || null}
        onClose={() => setContractModalVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 36,
  },
  walletSummaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.4,
  },
  metricDivider: {
    width: 0.5,
    height: 32,
    backgroundColor: colors.border,
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
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: -0.1,
  },
  segmentTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  invoicesList: {
    gap: 12,
  },
  invoiceCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  invoiceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceMonth: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  invoiceDue: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  invoiceBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderTopColor: colors.border,
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
});
