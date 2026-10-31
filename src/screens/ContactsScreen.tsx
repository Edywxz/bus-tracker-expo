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
import { SecurityService } from '../services/security';
import { AppleButton } from '../components/AppleButton';

export const ContactsScreen: React.FC = () => {
  const {
    pessoasAutorizadas,
    adicionarPessoaAutorizada,
    removerPessoaAutorizada,
    eventosCalendario,
  } = useApp();
  const [modalVisible, setModalVisible] = useState(false);

  const [novoNome, setNovoNome] = useState('');
  const [novoParentesco, setNovoParentesco] = useState('');
  const [novoCpf, setNovoCpf] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');

  const handleSalvar = () => {
    if (!novoNome.trim() || !novoParentesco.trim() || !novoTelefone.trim()) {
      Alert.alert('Campos Obrigatórios', 'Preencha o nome, parentesco e telefone.');
      return;
    }

    adicionarPessoaAutorizada({
      aluno_id: 'aluno-1',
      nome: novoNome.trim(),
      grau_parentesco: novoParentesco.trim(),
      cpf: novoCpf.trim() || '000.000.000-00',
      telefone: novoTelefone.trim(),
    });

    Alert.alert('Sucesso', 'Pessoa autorizada cadastrada com sucesso!');
    setNovoNome('');
    setNovoParentesco('');
    setNovoCpf('');
    setNovoTelefone('');
    setModalVisible(false);
  };

  const handleRemover = (id: string, nome: string) => {
    Alert.alert('Remover Autorização', `Deseja revogar a autorização de ${nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => removerPessoaAutorizada(id),
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* SEÇÃO 1: Pessoas Autorizadas (RF018) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Pessoas Autorizadas (RF018)</Text>
        <AppleButton
          variant="tonal"
          title="Adicionar"
          size="sm"
          icon={<Ionicons name="add" size={14} color={colors.accentText} />}
          onPress={() => setModalVisible(true)}
        />
      </View>

      <View style={styles.cardGroup}>
        {pessoasAutorizadas.map((p, index) => (
          <View
            key={p.id}
            style={[
              styles.contactRow,
              index < pessoasAutorizadas.length - 1 && styles.rowDivider,
            ]}
          >
            <View style={styles.contactAvatar}>
              <Text style={styles.contactInitials}>
                {p.nome
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </Text>
            </View>

            <View style={styles.contactInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.contactName}>{p.nome}</Text>
                <View style={styles.relationPill}>
                  <Text style={styles.relationText}>{p.grau_parentesco}</Text>
                </View>
              </View>
              <Text style={styles.contactSub}>
                {SecurityService.maskPhone(p.telefone)} • CPF {SecurityService.maskCpf(p.cpf)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => handleRemover(p.id, p.nome)}
              style={styles.trashCircle}
              activeOpacity={0.6}
            >
              <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* SEÇÃO 2: Instituição de Ensino (RF015) */}
      <Text style={[styles.sectionHeader, { marginTop: 22 }]}>
        Instituição de Ensino (RF015)
      </Text>

      <View style={styles.cardGroup}>
        <View style={styles.schoolRow}>
          <View style={styles.schoolIconCircle}>
            <Ionicons name="school" size={20} color={colors.systemPurple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.schoolName}>Colégio Santa Maria</Text>
            <Text style={styles.schoolCnpj}>CNPJ 12.345.678/0001-90</Text>
          </View>
        </View>

        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={15} color={colors.textTertiary} />
            <Text style={styles.infoValue}>Av. Tiradentes, 850 • Portões 1 e 2</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={15} color={colors.textTertiary} />
            <Text style={styles.infoValue}>Coordenação: (11) 3245-8900</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={15} color={colors.textTertiary} />
            <Text style={styles.infoValue}>
              Manhã: 07h-12h • Tarde: 13h-18h
            </Text>
          </View>
        </View>
      </View>

      {/* SEÇÃO 3: Calendário Escolar Oficial (RF019) */}
      <Text style={[styles.sectionHeader, { marginTop: 22 }]}>
        Calendário Escolar Oficial (RF019)
      </Text>

      <View style={styles.cardGroup}>
        {eventosCalendario.map((ev, idx) => (
          <View
            key={ev.id}
            style={[
              styles.calendarItem,
              idx < eventosCalendario.length - 1 && styles.rowDivider,
            ]}
          >
            <View style={styles.calendarDateBox}>
              <Text style={styles.calendarDay}>{ev.data.split('-')[2]}</Text>
              <Text style={styles.calendarMonth}>
                {ev.data.split('-')[1] === '11' ? 'NOV' : 'DEZ'}
              </Text>
            </View>

            <View style={styles.calendarInfo}>
              <View style={styles.calTop}>
                <Text style={styles.calendarTitle}>{ev.titulo}</Text>
                <View
                  style={[
                    styles.calPill,
                    {
                      backgroundColor:
                        ev.tipo === 'FERIADO'
                          ? colors.systemRedLight
                          : colors.systemBlueLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.calPillText,
                      {
                        color:
                          ev.tipo === 'FERIADO'
                            ? colors.systemRedText
                            : colors.systemBlueText,
                      },
                    ]}
                  >
                    {ev.tipo}
                  </Text>
                </View>
              </View>
              <Text style={styles.calendarDesc}>{ev.descricao}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Modal Apple para Nova Pessoa Autorizada */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.dragPill} />

            <View style={styles.sheetHeader}>
              <Text style={styles.modalTitle}>Cadastrar Pessoa Autorizada</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nome Completo:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Maria Helena da Silva"
              placeholderTextColor={colors.textTertiary}
              value={novoNome}
              onChangeText={setNovoNome}
            />

            <Text style={styles.label}>Parentesco / Vínculo:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Avó, Tia, Padrinho"
              placeholderTextColor={colors.textTertiary}
              value={novoParentesco}
              onChangeText={setNovoParentesco}
            />

            <Text style={styles.label}>Telefone Celular:</Text>
            <TextInput
              style={styles.input}
              placeholder="(11) 98765-4321"
              placeholderTextColor={colors.textTertiary}
              value={novoTelefone}
              onChangeText={setNovoTelefone}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>CPF (para validação):</Text>
            <TextInput
              style={styles.input}
              placeholder="000.000.000-00"
              placeholderTextColor={colors.textTertiary}
              value={novoCpf}
              onChangeText={setNovoCpf}
              keyboardType="numeric"
            />

            <AppleButton
              variant="primary"
              title="Salvar Autorização"
              onPress={handleSalvar}
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
    paddingBottom: 36,
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
  },
  cardGroup: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
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
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderBottomColor: colors.border,
  },
  contactAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 0.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInitials: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  contactInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  relationPill: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  relationText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  contactSub: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  trashCircle: {
    padding: 6,
  },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  schoolIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.systemPurpleLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  schoolCnpj: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 1,
  },
  infoList: {
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoValue: {
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: -0.1,
  },
  calendarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  calendarDateBox: {
    width: 42,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  calendarDay: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  calendarMonth: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.accentDark,
  },
  calendarInfo: {
    flex: 1,
  },
  calTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calendarTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  calPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  calPillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  calendarDesc: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
    letterSpacing: -0.1,
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
    letterSpacing: -0.2,
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
