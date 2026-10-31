import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { AbsenceModal } from '../components/AbsenceModal';
import { AppleButton } from '../components/AppleButton';

export const BoardingLogScreen: React.FC = () => {
  const {
    role,
    alunos,
    registrarEmbarque,
    offlineQueueCount,
    sincronizarFilaOffline,
  } = useApp();
  const [filter, setFilter] = useState<'TODOS' | 'MANHA' | 'TARDE' | 'EMBARCADOS'>('TODOS');
  const [syncing, setSyncing] = useState(false);
  const [absenceModalVisible, setAbsenceModalVisible] = useState(false);

  const handleEmbarcar = async (alunoId: string, nome: string) => {
    await registrarEmbarque(alunoId, 'EMBARQUE');
    Alert.alert('Embarque Confirmado', `${nome} embarcou na van.`);
  };

  const handleDesembarcar = async (alunoId: string, nome: string) => {
    await registrarEmbarque(alunoId, 'DESEMBARQUE');
    Alert.alert('Desembarque Concluído', `${nome} desembarcou com segurança.`);
  };

  const handleSincronizarOffline = async () => {
    setSyncing(true);
    try {
      const res = await sincronizarFilaOffline();
      Alert.alert(
        'Sincronização Concluída',
        `${res.sincronizados} registro(s) sincronizados com a nuvem!`
      );
    } catch {
      Alert.alert('Aviso', 'Erro ao sincronizar. O aparelho tentará novamente quando houver sinal.');
    } finally {
      setSyncing(false);
    }
  };

  const filteredAlunos = alunos.filter((a) => {
    if (filter === 'MANHA') return a.turno === 'MANHA';
    if (filter === 'TARDE') return a.turno === 'TARDE';
    if (filter === 'EMBARCADOS') return a.statusEmbarque === 'EMBARCADO';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EMBARCADO':
        return { label: 'Na Van', bg: colors.systemGreenLight, text: colors.systemGreenText };
      case 'DESEMBARCADO':
        return { label: 'Na Escola', bg: colors.systemBlueLight, text: colors.systemBlueText };
      case 'AUSENTE':
        return { label: 'Falta', bg: colors.systemRedLight, text: colors.systemRedText };
      case 'AGUARDANDO':
      default:
        return { label: 'Aguardando', bg: colors.surfaceSecondary, text: colors.textSecondary };
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Banner de Sincronização Offline Apple (RNF005) */}
      {offlineQueueCount > 0 && (
        <View style={styles.offlineBox}>
          <View style={styles.offlineLeft}>
            <View style={styles.offlineIcon}>
              <Ionicons name="cloud-offline" size={16} color={colors.systemOrange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.offlineTitle}>Operação Offline Ativa</Text>
              <Text style={styles.offlineDesc}>
                {offlineQueueCount} registro(s) salvos no aparelho.
              </Text>
            </View>
          </View>
          <AppleButton
            variant="tonal"
            title={syncing ? 'Sincronizando...' : 'Sincronizar'}
            size="sm"
            onPress={handleSincronizarOffline}
            disabled={syncing}
          />
        </View>
      )}

      {/* Segmented Control iOS para Filtros */}
      <View style={styles.segmentedControl}>
        {(['TODOS', 'MANHA', 'TARDE', 'EMBARCADOS'] as const).map((f) => {
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
                {f === 'TODOS'
                  ? 'Todos'
                  : f === 'MANHA'
                  ? 'Manhã'
                  : f === 'TARDE'
                  ? 'Tarde'
                  : 'A Bordo'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Lista de Alunos (Cards Inset Grouped) */}
      <View style={styles.studentsList}>
        {filteredAlunos.map((aluno) => {
          const badge = getStatusBadge(aluno.statusEmbarque);

          return (
            <View key={aluno.id} style={styles.studentCard}>
              <View style={styles.cardHeader}>
                {/* Avatar com Iniciais no Estilo Apple Contacts */}
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>
                    {aluno.nome
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </Text>
                </View>

                {/* Nome e Turma */}
                <View style={styles.nameContainer}>
                  <View style={styles.nameRow}>
                    <Text style={styles.studentName}>{aluno.nome}</Text>
                    <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeLabel, { color: badge.text }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.studentClass}>
                    {aluno.turma} • Turno {aluno.turno}
                  </Text>
                </View>
              </View>

              {/* Endereço de Busca e Entrega */}
              <View style={styles.addressBlock}>
                <View style={styles.addressRow}>
                  <Ionicons name="home-outline" size={13} color={colors.textTertiary} />
                  <Text style={styles.addressValue} numberOfLines={1}>
                    {aluno.endereco_busca}
                  </Text>
                </View>
                <View style={styles.addressRow}>
                  <Ionicons name="school-outline" size={13} color={colors.textTertiary} />
                  <Text style={styles.addressValue} numberOfLines={1}>
                    {aluno.endereco_entrega}
                  </Text>
                </View>

                {aluno.observacoes_medicas ? (
                  <View style={styles.medicalPill}>
                    <Ionicons name="medical" size={11} color={colors.systemRed} />
                    <Text style={styles.medicalText}>
                      {aluno.observacoes_medicas}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Último Registro com Timestamp */}
              {aluno.ultimoRegistro && (
                <Text style={styles.lastLogText}>{aluno.ultimoRegistro}</Text>
              )}

              {/* Ações de 1 Toque com AppleButton */}
              {role === 'TRANSPORTADOR' && (
                <View style={styles.actionsBar}>
                  <AppleButton
                    variant="tonal"
                    title="Embarcou"
                    icon={<Ionicons name="arrow-up-circle" size={15} color={colors.accentText} />}
                    size="sm"
                    onPress={() => handleEmbarcar(aluno.id, aluno.nome)}
                    disabled={aluno.statusEmbarque === 'EMBARCADO'}
                    style={{ flex: 1 }}
                  />

                  <AppleButton
                    variant="secondary"
                    title="Desembarcou"
                    icon={<Ionicons name="arrow-down-circle" size={15} color={colors.textPrimary} />}
                    size="sm"
                    onPress={() => handleDesembarcar(aluno.id, aluno.nome)}
                    disabled={aluno.statusEmbarque === 'DESEMBARCADO'}
                    style={{ flex: 1 }}
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>

      <AbsenceModal
        visible={absenceModalVisible}
        onClose={() => setAbsenceModalVisible(false)}
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
  offlineBox: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  offlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  offlineIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.systemOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  offlineDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
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
  studentsList: {
    gap: 12,
  },
  studentCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentUltraLight,
    borderWidth: 1,
    borderColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accentDark,
    letterSpacing: -0.2,
  },
  nameContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  badgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  studentClass: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  addressBlock: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    gap: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressValue: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
    letterSpacing: -0.1,
  },
  medicalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  medicalText: {
    fontSize: 11,
    color: colors.systemRedText,
    fontWeight: '500',
  },
  lastLogText: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderTopColor: colors.border,
  },
});
