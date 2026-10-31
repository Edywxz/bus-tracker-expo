import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { TipoUsuario } from '../types/database';
import { SecurityService } from '../services/security';
import { isSupabaseConfigured } from '../services/supabase';
import { AppleButton } from '../components/AppleButton';

export const ProfileScreen: React.FC = () => {
  const { role, setRole, veiculo, atualizarVeiculo } = useApp();
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);

  const [placa, setPlaca] = useState(veiculo.placa);
  const [modelo, setModelo] = useState(veiculo.modelo);
  const [capacidade, setCapacidade] = useState(String(veiculo.capacidade_assentos));
  const [alvara, setAlvara] = useState(veiculo.numero_alvara);
  const [vistoria, setVistoria] = useState(veiculo.validade_vistoria);

  const handleSalvarVeiculo = () => {
    if (!SecurityService.isValidPlaca(placa)) {
      Alert.alert('Placa Inválida', 'Informe uma placa válida no formato Mercosul.');
      return;
    }

    atualizarVeiculo({
      placa: placa.toUpperCase(),
      modelo,
      capacidade_assentos: parseInt(capacidade, 10) || 16,
      numero_alvara: alvara,
      validade_vistoria: vistoria,
    });

    Alert.alert('Sucesso', 'Dados do veículo atualizados!');
    setVehicleModalVisible(false);
  };

  const getProfileData = () => {
    switch (role) {
      case 'TRANSPORTADOR':
        return {
          nome: 'Marcos Oliveira (Tio Marcos)',
          email: 'marcos.transporte@escolar.com.br',
          cpf: '123.456.789-00',
          telefone: '(11) 98765-4321',
          roleLabel: 'Transportador Escolar Autônomo',
          cnh: 'Cat. D com EAR',
          alvara: 'AUT-9874/2026',
        };
      case 'INSTITUICAO':
        return {
          nome: 'Coordenação Santa Maria',
          email: 'transporte@colegiosantamaria.com.br',
          cpf: '12.345.678/0001-90',
          telefone: '(11) 3245-8900',
          roleLabel: 'Instituição de Ensino',
          cnh: 'N/A',
          alvara: 'MEC-SP-894',
        };
      case 'RESPONSAVEL':
      default:
        return {
          nome: 'Carlos Eduardo Silva',
          email: 'carlos.silva@email.com.br',
          cpf: '987.654.321-00',
          telefone: '(11) 97654-3210',
          roleLabel: 'Pais / Responsável',
          cnh: 'N/A',
          alvara: 'N/A',
        };
    }
  };

  const current = getProfileData();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Banner de Perfil Estilo Apple ID */}
      <View style={styles.appleIdCard}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarEmoji}>
            {role === 'TRANSPORTADOR' ? '👨‍✈️' : role === 'RESPONSAVEL' ? '👨‍👩‍👧' : '🏫'}
          </Text>
        </View>
        <Text style={styles.profileName}>{current.nome}</Text>
        <Text style={styles.profileRole}>{current.roleLabel}</Text>
        <Text style={styles.profileEmail}>{current.email}</Text>
      </View>

      {/* SEÇÃO INSET GROUPED: Dados Cadastrais */}
      <Text style={styles.sectionHeader}>Dados Cadastrais (RF001)</Text>
      <View style={styles.cardGroup}>
        <View style={[styles.detailRow, styles.rowDivider]}>
          <Text style={styles.detailLabel}>Documento:</Text>
          <Text style={styles.detailVal}>{SecurityService.maskCpf(current.cpf)}</Text>
        </View>
        <View style={[styles.detailRow, role === 'RESPONSAVEL' && styles.rowDivider]}>
          <Text style={styles.detailLabel}>Telefone:</Text>
          <Text style={styles.detailVal}>{SecurityService.maskPhone(current.telefone)}</Text>
        </View>
        {role === 'RESPONSAVEL' && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Endereço:</Text>
            <Text style={styles.detailVal}>Rua das Flores, 142 • Apto 31</Text>
          </View>
        )}
      </View>

      {/* SEÇÃO INSET GROUPED: Alternador de Perfis (RF010) */}
      <Text style={[styles.sectionHeader, { marginTop: 22 }]}>
        Alternar Visão de Papel (RF010)
      </Text>
      <View style={styles.cardGroup}>
        {(['RESPONSAVEL', 'TRANSPORTADOR', 'INSTITUICAO'] as TipoUsuario[]).map((r, idx) => {
          const isSelected = role === r;
          return (
            <TouchableOpacity
              key={r}
              style={[
                styles.roleSelectRow,
                idx < 2 && styles.rowDivider,
              ]}
              onPress={() => setRole(r)}
              activeOpacity={0.6}
            >
              <View style={styles.roleRowLeft}>
                <Ionicons
                  name={
                    r === 'TRANSPORTADOR'
                      ? 'bus-outline'
                      : r === 'RESPONSAVEL'
                      ? 'people-outline'
                      : 'school-outline'
                  }
                  size={18}
                  color={isSelected ? colors.accentDark : colors.textTertiary}
                />
                <Text style={[styles.roleSelectText, isSelected && styles.roleSelectTextActive]}>
                  {r === 'RESPONSAVEL'
                    ? 'Pais (Responsável)'
                    : r === 'TRANSPORTADOR'
                    ? 'Transportador Autônomo'
                    : 'Instituição de Ensino'}
                </Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark" size={18} color={colors.accentDark} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* SEÇÃO INSET GROUPED: Veículo e Motorista (RF013, RF014) */}
      {role === 'TRANSPORTADOR' && (
        <>
          <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
            <Text style={styles.sectionHeader}>Veículo Escolar (RF013)</Text>
            <AppleButton
              variant="ghost"
              title="Editar"
              size="sm"
              onPress={() => setVehicleModalVisible(true)}
            />
          </View>

          <View style={styles.cardGroup}>
            <View style={[styles.vehicleHeadRow, styles.rowDivider]}>
              <View>
                <Text style={styles.vehicleModel}>{veiculo.modelo}</Text>
                <Text style={styles.vehicleMeta}>
                  Ano {veiculo.ano} • {veiculo.capacidade_assentos} lugares
                </Text>
              </View>
              <View style={styles.mercPlate}>
                <View style={styles.mercBlue}>
                  <Text style={styles.mercBrasil}>BRASIL</Text>
                </View>
                <Text style={styles.mercNumber}>{veiculo.placa}</Text>
              </View>
            </View>

            <View style={styles.specsRow}>
              <View style={styles.specBox}>
                <Text style={styles.specLabel}>Alvará</Text>
                <Text style={styles.specVal}>{veiculo.numero_alvara}</Text>
              </View>
              <View style={styles.specDivider} />
              <View style={styles.specBox}>
                <Text style={styles.specLabel}>Vistoria</Text>
                <Text style={[styles.specVal, { color: colors.systemGreenText }]}>
                  {SecurityService.formatDate(veiculo.validade_vistoria)} ✅
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionHeader, { marginTop: 22 }]}>
            Condutor Auxiliar / Substituto (RF014)
          </Text>
          <View style={styles.cardGroup}>
            <View style={styles.driverSubRow}>
              <View style={styles.driverSubLeft}>
                <Ionicons name="person-circle-outline" size={32} color={colors.textSecondary} />
                <View>
                  <Text style={styles.driverSubName}>João Pereira da Silva</Text>
                  <Text style={styles.driverSubCnh}>CNH Cat. D com EAR • Homologado</Text>
                </View>
              </View>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>Ativo</Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* SEÇÃO INSET GROUPED: Privacidade e LGPD (RNF001, RNF006, RNF008) */}
      <Text style={[styles.sectionHeader, { marginTop: 22 }]}>
        Privacidade & Segurança (LGPD)
      </Text>
      <View style={styles.cardGroup}>
        <View style={[styles.secRow, styles.rowDivider]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.systemGreen} />
          <View style={{ flex: 1 }}>
            <Text style={styles.secTitle}>Criptografia em Trânsito (RNF001)</Text>
            <Text style={styles.secDesc}>
              Conexão protegida via TLS 1.3 e dados pessoais mascarados.
            </Text>
          </View>
        </View>

        <View style={[styles.secRow, styles.rowDivider]}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.accentDark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.secTitle}>Isolamento de Dados (RNF008)</Text>
            <Text style={styles.secDesc}>
              Segurança por Row Level Security no PostgreSQL/Supabase.
            </Text>
          </View>
        </View>

        <View style={styles.secRow}>
          <Ionicons
            name="cloud-done-outline"
            size={18}
            color={isSupabaseConfigured() ? colors.systemBlue : colors.textTertiary}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.secTitle}>Conexão Supabase</Text>
            <Text style={styles.secDesc}>
              {isSupabaseConfigured()
                ? 'Nuvem Supabase sincronizada com PostGIS.'
                : 'Operação Local com fila offline integrada (RNF005).'}
            </Text>
          </View>
        </View>
      </View>

      {/* Modal Apple para Edição de Veículo (RF013) */}
      <Modal visible={vehicleModalVisible} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setVehicleModalVisible(false)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.dragPill} />

            <View style={styles.sheetHeader}>
              <Text style={styles.modalTitle}>Editar Veículo (RF013)</Text>
              <TouchableOpacity onPress={() => setVehicleModalVisible(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Modelo da Van:</Text>
            <TextInput
              style={styles.input}
              value={modelo}
              onChangeText={setModelo}
              placeholder="Ex: Renault Master Escolar"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.label}>Placa Mercosul:</Text>
            <TextInput
              style={styles.input}
              value={placa}
              onChangeText={setPlaca}
              autoCapitalize="characters"
              placeholder="BRA2E19"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.label}>Lotação (Assentos):</Text>
            <TextInput
              style={styles.input}
              value={capacidade}
              onChangeText={setCapacidade}
              keyboardType="numeric"
              placeholder="16"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.label}>Alvará de Autônomo:</Text>
            <TextInput
              style={styles.input}
              value={alvara}
              onChangeText={setAlvara}
              placeholder="AUT-9874/2026"
              placeholderTextColor={colors.textTertiary}
            />

            <AppleButton
              variant="primary"
              title="Salvar Veículo"
              onPress={handleSalvarVeiculo}
              size="lg"
              style={{ marginTop: 14 }}
            />
          </View>
        </Pressable>
      </Modal>
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
    paddingBottom: 40,
  },
  appleIdCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderColor: colors.border,
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
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  profileRole: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accentDark,
    marginTop: 3,
  },
  profileEmail: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginLeft: 4,
    marginBottom: 8,
  },
  cardGroup: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: -0.1,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  roleSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },
  roleRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roleSelectText: {
    fontSize: 14,
    color: colors.textSecondary,
    letterSpacing: -0.1,
  },
  roleSelectTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  vehicleHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  vehicleModel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  vehicleMeta: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  mercPlate: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#003399',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  mercBlue: {
    backgroundColor: '#003399',
    width: '100%',
    alignItems: 'center',
    borderRadius: 2,
    marginBottom: 1,
  },
  mercBrasil: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '800',
  },
  mercNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 1,
  },
  specsRow: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  specBox: {
    flex: 1,
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  specVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
  },
  specDivider: {
    width: 0.5,
    height: 24,
    backgroundColor: colors.border,
  },
  driverSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  driverSubLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  driverSubName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  driverSubCnh: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 1,
  },
  activePill: {
    backgroundColor: colors.systemGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.systemGreenText,
  },
  secRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
  },
  secTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  secDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
});
