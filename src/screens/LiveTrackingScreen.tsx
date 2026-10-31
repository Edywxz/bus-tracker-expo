import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { LiveMapCard } from '../components/LiveMapCard';
import { TimelineItem } from '../components/TimelineItem';
import { EmergencyModal } from '../components/EmergencyModal';
import { AbsenceModal } from '../components/AbsenceModal';
import { AppleButton } from '../components/AppleButton';

export const LiveTrackingScreen: React.FC = () => {
  const { role, viagemAtiva, alunos } = useApp();
  const [emergencyVisible, setEmergencyVisible] = useState(false);
  const [absenceVisible, setAbsenceVisible] = useState(false);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Banner Elegante no Padrão iOS */}
      <View style={styles.topCard}>
        <View style={styles.topCardLeft}>
          <Text style={styles.topCardTitle}>
            {viagemAtiva.tipo_viagem === 'IDA' ? 'Trajeto Matutino • Ida' : 'Trajeto de Retorno • Volta'}
          </Text>
          <Text style={styles.topCardSubtitle}>
            Destino: Colégio Santa Maria • {viagemAtiva.km_percorrido} km percorridos
          </Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveLabel}>AO VIVO</Text>
        </View>
      </View>

      {/* Card do Mapa Interativo com Telemetria (RF003, RNF002) */}
      <LiveMapCard onReportEmergency={() => setEmergencyVisible(true)} />

      {/* Ação Rápida para Pais (RF009: Comunicar Ausência) */}
      {role === 'RESPONSAVEL' && (
        <View style={styles.parentActionArea}>
          <AppleButton
            variant="tonal"
            title="Comunicar Falta do Aluno"
            icon={<Ionicons name="calendar-outline" size={16} color={colors.accentText} />}
            onPress={() => setAbsenceVisible(true)}
            size="md"
          />
        </View>
      )}

      {/* Seção Inset Grouped: Itinerário de Paradas */}
      <View style={styles.sectionHeaderWrap}>
        <Text style={styles.sectionHeader}>Itinerário da Rota Atual</Text>
        <Text style={styles.sectionBadge}>
          {alunos.filter((a) => a.statusEmbarque === 'EMBARCADO').length} de {alunos.length} a bordo
        </Text>
      </View>

      <View style={styles.cardGroup}>
        <TimelineItem
          title="Gabriel Costa (6º Ano C)"
          subtitle="Rua Augusta, 980"
          timestamp="07:05 • Embarque realizado na residência"
          status="EMBARCADO"
        />

        <TimelineItem
          title="Lucas Silva (5º Ano B)"
          subtitle="Rua das Flores, 142"
          timestamp="07:15 • Embarque realizado na residência"
          status="EMBARCADO"
        />

        <TimelineItem
          title="Beatriz Santos (4º Ano A)"
          subtitle="Av. Brasil, 450"
          timestamp="Previsão: 07:22 • Van a ~4 min"
          status="AGUARDANDO"
        />

        <TimelineItem
          title="Sofia Lima (3º Ano B)"
          subtitle="Rua Pamplona, 320"
          timestamp="Falta comunicada pelos pais (Ponto dispensado)"
          status="AUSENTE"
        />

        <TimelineItem
          title="Colégio Santa Maria (Destino)"
          subtitle="Av. Tiradentes, 850 • Portão 2"
          timestamp="Previsão de Desembarque: 07:35"
          status="DESEMBARCADO"
          isLast
        />
      </View>

      {/* Modais com Animação Nativa */}
      <EmergencyModal visible={emergencyVisible} onClose={() => setEmergencyVisible(false)} />
      <AbsenceModal visible={absenceVisible} onClose={() => setAbsenceVisible(false)} />
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
  topCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  topCardLeft: {
    flex: 1,
  },
  topCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  topCardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.systemRedLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.systemRed,
  },
  liveLabel: {
    color: colors.systemRed,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  parentActionArea: {
    marginBottom: 14,
  },
  sectionHeaderWrap: {
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
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accentDark,
    letterSpacing: -0.1,
  },
  cardGroup: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
});
