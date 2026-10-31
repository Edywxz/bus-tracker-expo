import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { ContratoServico } from '../types/database';
import { SecurityService } from '../services/security';
import { AppleButton } from './AppleButton';

interface ContractModalProps {
  visible: boolean;
  contrato: ContratoServico | null;
  onClose: () => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  visible,
  contrato,
  onClose,
}) => {
  if (!contrato) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.dragPill} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Contrato de Transporte Escolar</Text>
              <Text style={styles.subtitle}>
                Nº {contrato.numero_contrato} • Status: {contrato.status}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeCircle}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.sectionCard}>
              <Text style={styles.clauseTitle}>1. Das Partes Contratantes</Text>
              <Text style={styles.clauseText}>
                <Text style={styles.boldText}>Transportador:</Text> Marcos Oliveira (Tio Marcos) — Condutor com CNH Cat. D/E e Alvará Municipal nº AUT-9874/2026.
              </Text>
              <Text style={styles.clauseText}>
                <Text style={styles.boldText}>Contratante:</Text> Carlos Eduardo Silva, responsável legal pelo dependente Lucas Silva.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.clauseTitle}>2. Do Objeto e Itinerário</Text>
              <Text style={styles.clauseText}>
                Transporte escolar da residência cadastrada para o Colégio Santa Maria e retorno nos dias letivos regulares.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.clauseTitle}>3. Valor e Vencimento</Text>
              <Text style={styles.clauseText}>
                Mensalidade de{' '}
                <Text style={styles.boldText}>
                  {SecurityService.formatCurrency(contrato.valor_mensalidade)}
                </Text>
                , com vencimento todo dia {contrato.dia_vencimento} via PIX, Cartão ou Boleto Bancário.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.clauseTitle}>4. Da Frota e Vistorias</Text>
              <Text style={styles.clauseText}>
                Veículo Renault Master Minibus (Placa BRA2E19) com cintos de retenção individuais em todos os assentos e vistoria técnica semestral aprovada.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.clauseTitle}>5. Vigência</Text>
              <Text style={styles.clauseText}>
                De {SecurityService.formatDate(contrato.data_inicio)} até{' '}
                {SecurityService.formatDate(contrato.data_termino)}.
              </Text>
            </View>

            <AppleButton
              variant="primary"
              title="Fechar Documento"
              onPress={onClose}
              size="lg"
              style={{ marginTop: 8 }}
            />
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
    maxHeight: '85%',
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
  content: {
    paddingBottom: 20,
  },
  sectionCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: 10,
  },
  clauseTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accentDark,
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  clauseText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  boldText: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
