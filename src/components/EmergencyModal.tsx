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
import { SeveridadeEvento } from '../types/database';
import { useApp } from '../context/AppContext';
import { AppleButton } from './AppleButton';

interface EmergencyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ visible, onClose }) => {
  const { registrarEventoRota } = useApp();
  const [tipo, setTipo] = useState('Trânsito Intenso');
  const [descricao, setDescricao] = useState('');
  const [severidade, setSeveridade] = useState<SeveridadeEvento>('MEDIA');

  const tiposComuns = [
    'Trânsito Intenso',
    'Pane Mecânica',
    'Desvio de Via',
    'Acidente na Pista',
    'Emergência Médica',
  ];

  const handleSalvar = async () => {
    if (!descricao.trim()) {
      Alert.alert('Atenção', 'Insira uma breve descrição da ocorrência.');
      return;
    }

    await registrarEventoRota(tipo, descricao, severidade);
    Alert.alert(
      'Alerta Disparado',
      'Os responsáveis e a coordenação escolar foram informados instantaneamente.'
    );
    setDescricao('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.dragPill} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Registrar Ocorrência de Rota</Text>
              <Text style={styles.subtitle}>
                Dispare um aviso imediato de trânsito ou emergência aos pais (RF011)
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeCircle}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Tipo de Evento:</Text>
          <View style={styles.pillsRow}>
            {tiposComuns.map((t) => {
              const isSelected = tipo === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.pill, isSelected && styles.pillActive]}
                  onPress={() => setTipo(t)}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Gravidade:</Text>
          <View style={styles.severityRow}>
            {(['BAIXA', 'MEDIA', 'ALTA', 'EMERGENCIA'] as SeveridadeEvento[]).map((s) => {
              const isSelected = severidade === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.sevBtn,
                    isSelected && {
                      backgroundColor:
                        s === 'EMERGENCIA'
                          ? colors.systemRed
                          : s === 'ALTA'
                          ? colors.systemRedLight
                          : s === 'MEDIA'
                          ? colors.accentLight
                          : colors.systemBlueLight,
                      borderColor:
                        s === 'EMERGENCIA'
                          ? colors.systemRed
                          : colors.accent,
                    },
                  ]}
                  onPress={() => setSeveridade(s)}
                >
                  <Text
                    style={[
                      styles.sevBtnText,
                      isSelected && {
                        color: s === 'EMERGENCIA' ? '#FFF' : colors.textPrimary,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Detalhes / Previsão:</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={3}
            placeholder="Ex: Trânsito parado na Av. Brasil. Atraso estimado de 15 minutos."
            placeholderTextColor={colors.textTertiary}
            value={descricao}
            onChangeText={setDescricao}
          />

          <AppleButton
            variant="destructive"
            title="Disparar Alerta a Todos"
            icon={<Ionicons name="megaphone" size={16} color={colors.systemRed} />}
            onPress={handleSalvar}
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
    gap: 6,
  },
  pill: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.accentUltraLight,
    borderColor: colors.accent,
  },
  pillText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  pillTextActive: {
    fontWeight: '700',
    color: colors.accentText,
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sevBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  sevBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  textArea: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: colors.textPrimary,
    height: 70,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
});
