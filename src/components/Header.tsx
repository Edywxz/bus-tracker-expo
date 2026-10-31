import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { TipoUsuario } from '../types/database';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { role, setRole, offlineQueueCount, isOnline } = useApp();
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  const getRoleLabel = (r: TipoUsuario) => {
    switch (r) {
      case 'RESPONSAVEL':
        return 'Pais / Responsável';
      case 'TRANSPORTADOR':
        return 'Tio Marcos (Motorista)';
      case 'INSTITUICAO':
        return 'Colégio Santa Maria';
    }
  };

  const getRoleBadgeStyle = (r: TipoUsuario) => {
    switch (r) {
      case 'RESPONSAVEL':
        return {
          bg: colors.systemBlueLight,
          text: colors.systemBlue,
          icon: 'people' as const,
        };
      case 'TRANSPORTADOR':
        return {
          bg: colors.accentLight,
          text: colors.accentText,
          icon: 'bus' as const,
        };
      case 'INSTITUICAO':
        return {
          bg: colors.systemPurpleLight,
          text: colors.systemPurple,
          icon: 'school' as const,
        };
    }
  };

  const currentBadge = getRoleBadgeStyle(role);

  return (
    <View style={styles.container}>
      {/* Barra de Status e Identidade no Topo */}
      <View style={styles.topBar}>
        <View style={styles.brandGroup}>
          <View style={styles.logoBadge}>
            <Ionicons name="bus" size={17} color={colors.accentDark} />
          </View>
          <View>
            <Text style={styles.brandTitle}>VanEscolar</Text>
            <View style={styles.statusIndicator}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isOnline ? colors.systemGreen : colors.systemRed },
                ]}
              />
              <Text style={styles.statusLabel}>
                {isOnline ? 'GPS Conectado' : 'Modo Offline'}
              </Text>
            </View>
          </View>
        </View>

        {/* Pílula Apple para Seleção de Perfil (RF010) */}
        <TouchableOpacity
          style={[styles.rolePill, { backgroundColor: currentBadge.bg }]}
          onPress={() => setRoleModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name={currentBadge.icon} size={14} color={currentBadge.text} />
          <Text style={[styles.rolePillText, { color: currentBadge.text }]}>
            {role === 'TRANSPORTADOR'
              ? 'Motorista'
              : role === 'RESPONSAVEL'
              ? 'Pais'
              : 'Escola'}
          </Text>
          <Ionicons name="chevron-down" size={12} color={currentBadge.text} />
        </TouchableOpacity>
      </View>

      {/* Banner de Sincronização Offline Elegante (RNF005) */}
      {offlineQueueCount > 0 && (
        <View style={styles.offlinePill}>
          <Ionicons name="cloud-offline" size={13} color={colors.systemOrange} />
          <Text style={styles.offlineText}>
            {offlineQueueCount} registro(s) pendente(s) de sincronização
          </Text>
        </View>
      )}

      {/* Título Principal da Tela (Large Title Apple HIG) */}
      {title && (
        <View style={styles.titleArea}>
          <Text style={styles.screenTitle}>{title}</Text>
          {subtitle && <Text style={styles.screenSubtitle}>{subtitle}</Text>}
        </View>
      )}

      {/* Modal Estilo iOS ActionSheet / Card de Seleção de Papéis */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setRoleModalVisible(false)}
        >
          <View style={styles.sheetContainer} onStartShouldSetResponder={() => true}>
            {/* Indicador de puxar (Drag Indicator Apple) */}
            <View style={styles.dragIndicator} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Perfil de Acesso</Text>
              <Text style={styles.sheetDesc}>
                Selecione o papel do usuário para visualizar a experiência de acordo com os requisitos e casos de uso:
              </Text>
            </View>

            <View style={styles.optionsList}>
              {(['RESPONSAVEL', 'TRANSPORTADOR', 'INSTITUICAO'] as TipoUsuario[]).map((r) => {
                const isSelected = role === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.sheetOption,
                      isSelected && styles.sheetOptionActive,
                    ]}
                    onPress={() => {
                      setRole(r);
                      setRoleModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionLeft}>
                      <View
                        style={[
                          styles.optionIconBox,
                          isSelected && { backgroundColor: colors.accentLight },
                        ]}
                      >
                        <Ionicons
                          name={
                            r === 'TRANSPORTADOR'
                              ? 'bus-outline'
                              : r === 'RESPONSAVEL'
                              ? 'people-outline'
                              : 'school-outline'
                          }
                          size={18}
                          color={isSelected ? colors.accentDark : colors.textSecondary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.optionTitle,
                            isSelected && styles.optionTitleActive,
                          ]}
                        >
                          {getRoleLabel(r)}
                        </Text>
                        <Text style={styles.optionDescription}>
                          {r === 'RESPONSAVEL' && 'Acompanha o trajeto, mensalidades e comunica faltas'}
                          {r === 'TRANSPORTADOR' && 'Inicia rotas, embarque/desembarque e alertas de trânsito'}
                          {r === 'INSTITUICAO' && 'Acompanha chegadas de alunos e calendário letivo'}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.accent}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 14,
    borderBottomWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderBottomColor: colors.border,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.systemOrangeLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 10,
  },
  offlineText: {
    fontSize: 12,
    color: '#9A3412',
    fontWeight: '500',
  },
  titleArea: {
    marginTop: 14,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  screenSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
    letterSpacing: -0.1,
  },

  // Modal / ActionSheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 10,
  },
  dragIndicator: {
    width: 36,
    height: 5,
    backgroundColor: colors.systemGray5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  sheetDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  optionsList: {
    gap: 10,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetOptionActive: {
    backgroundColor: colors.accentUltraLight,
    borderColor: colors.accent,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  optionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  optionTitleActive: {
    color: colors.accentText,
    fontWeight: '700',
  },
  optionDescription: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
    lineHeight: 16,
  },
});
