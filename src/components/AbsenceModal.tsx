import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { PeriodoAusencia } from '../types/database';
import { useApp } from '../context/AppContext';
import { AppleButton } from './AppleButton';

interface AbsenceModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AbsenceModal: React.FC<AbsenceModalProps> = ({ visible, onClose }) => {
  const { alunos, comunicarAusencia } = useApp();
  const [selectedAlunoId, setSelectedAlunoId] = useState(alunos[0]?.id || '');
  const [periodo, setPeriodo] = useState<PeriodoAusencia>('AMBOS');
  const [motivo, setMotivo] = useState('');

  const motivosPredefinidos = [
    'Consulta Médica',
    'Indisposição',
    'Compromisso Familiar',
    'Pais levarão hoje',
  ];

  const handleEnviar = async () => {
    if (!selectedAlunoId) {
      Alert.alert('Atenção', 'Selecione um aluno.');
      return;
    }

    await comunicarAusencia(selectedAlunoId, periodo, motivo);
    Alert.alert(
      'Falta Registrada',
      'O Tio Marcos foi notificado e o percurso da van foi otimizado para hoje.'
    );
    setMotivo('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.dragPill} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Comunicar Ausência (RF009)</Text>
              <Text style={styles.subtitle}>
                Avise o motorista para otimização da rota e segurança do aluno
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeCircle}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Selecione o Aluno:</Text>
          <View style={styles.pillsRow}>
            {alunos.map((a) => {
              const isSelected = selectedAlunoId === a.id;
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.choicePill, isSelected && styles.choicePillActive]}
                  onPress={() => setSelectedAlunoId(a.id)}
                >
                  <Text
                    style={[
                      styles.choicePillText,
                      isSelected && styles.choicePillTextActive,
                    ]}
                  >
                    {a.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Período:</Text>
          <View style={styles.periodRow}>
            {(['IDA', 'VOLTA', 'AMBOS'] as PeriodoAusencia[]).map((p) => {
              const isSelected = periodo === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodBtn, isSelected && styles.periodBtnActive]}
                  onPress={() => setPeriodo(p)}
                >
                  <Text
                    style={[
                      styles.periodBtnText,
                      isSelected && styles.periodBtnTextActive,
                    ]}
                  >
                    {p === 'IDA' ? 'Ida' : p === 'VOLTA' ? 'Volta' : 'Ida e Volta'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Motivo Frequente:</Text>
          <View style={styles.chipsRow}>
            {motivosPredefinidos.map((m) => (
              <TouchableOpacity
                key={m}
                style={styles.chip}
                onPress={() => setMotivo(m)}
              >
                <Text style={styles.chipText}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Observações:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Consulta às 09h..."
            placeholderTextColor={colors.textTertiary}
            value={motivo}
            onChangeText={setMotivo}
          />

          <AppleButton
            variant="primary"
            title="Enviar Aviso ao Motorista"
            icon={<Ionicons name="send" size={15} color="#FFF" />}
            onPress={handleEnviar}
            size="lg"
            style={{ marginTop: 8 }}
          />
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choicePill: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  choicePillActive: {
    backgroundColor: colors.accentUltraLight,
    borderColor: colors.accent,
  },
  choicePillText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  choicePillTextActive: {
    color: colors.accentText,
    fontWeight: '700',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  periodBtnActive: {
    backgroundColor: colors.accentUltraLight,
    borderColor: colors.accent,
  },
  periodBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  periodBtnTextActive: {
    color: colors.accentText,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 11,
    color: colors.textSecondary,
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
    marginBottom: 16,
  },
});
