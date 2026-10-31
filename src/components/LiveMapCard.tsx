import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { AppleButton } from './AppleButton';

interface LiveMapCardProps {
  onReportEmergency?: () => void;
}

export const LiveMapCard: React.FC<LiveMapCardProps> = ({ onReportEmergency }) => {
  const {
    gpsPosicao,
    simularPassoGps,
    viagemAtiva,
    role,
    iniciarViagem,
    finalizarViagem,
  } = useApp();
  const [hornSent, setHornSent] = useState(false);

  const handleHorn = () => {
    setHornSent(true);
    Alert.alert(
      'Notificação Enviada',
      'Aviso transmitido aos pais: "O Tio Marcos acabou de chegar ao ponto de embarque!"'
    );
    setTimeout(() => setHornSent(false), 2500);
  };

  const isEmAndamento = viagemAtiva.status === 'EM_ANDAMENTO';

  return (
    <View style={styles.card}>
      {/* Topo: Status do Trajeto e ETA */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: isEmAndamento ? colors.systemGreenLight : colors.systemGray6 },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isEmAndamento ? colors.systemGreen : colors.systemGray },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isEmAndamento ? colors.systemGreenText : colors.textSecondary },
              ]}
            >
              {isEmAndamento ? 'Em Trânsito' : 'Estacionada'}
            </Text>
          </View>
          <Text style={styles.tripSub}>
            Turno {viagemAtiva.turno} • {viagemAtiva.tipo_viagem === 'IDA' ? 'Ida ao Colégio' : 'Volta'}
          </Text>
        </View>

        <View style={styles.etaBadge}>
          <Ionicons name="time" size={13} color={colors.accentDark} />
          <Text style={styles.etaText}>Chegada em ~4 min</Text>
        </View>
      </View>

      {/* Canvas do Mapa no estilo Apple Maps (Minimalista e Elegante) */}
      <View style={styles.mapCanvas}>
        {/* Vias e Quarteirões Suaves */}
        <View style={styles.streetHorizontal1} />
        <View style={styles.streetHorizontal2} />
        <View style={styles.streetVertical1} />
        <View style={styles.streetVertical2} />

        {/* Linha de Trajeto da Rota (Traçado Limpo Apple) */}
        <View style={styles.routePath} />

        {/* Parada 1: Residência Gabriel */}
        <View style={[styles.stopPin, { top: 32, left: 36 }]}>
          <View style={styles.stopIconCircle}>
            <Ionicons name="home" size={12} color={colors.systemBlue} />
          </View>
          <Text style={styles.pinLabel}>Gabriel</Text>
        </View>

        {/* Parada 2: Residência Lucas (Embarcou) */}
        <View style={[styles.stopPin, { top: 76, left: 146 }]}>
          <View style={[styles.stopIconCircle, { borderColor: colors.systemGreen }]}>
            <Ionicons name="checkmark" size={13} color={colors.systemGreen} />
          </View>
          <Text style={styles.pinLabel}>Lucas</Text>
        </View>

        {/* Parada 3: Próxima parada (Beatriz) */}
        <View style={[styles.stopPin, { top: 118, right: 94 }]}>
          <View style={[styles.stopIconCircle, { backgroundColor: colors.accent, borderColor: '#FFF' }]}>
            <Ionicons name="pin" size={12} color="#FFF" />
          </View>
          <View style={styles.nextStopTag}>
            <Text style={styles.nextStopTagText}>Próxima: Beatriz</Text>
          </View>
        </View>

        {/* Destino: Colégio Santa Maria */}
        <View style={[styles.stopPin, { bottom: 20, right: 28 }]}>
          <View style={[styles.stopIconCircle, { backgroundColor: colors.textPrimary, borderColor: '#FFF' }]}>
            <Ionicons name="school" size={13} color="#FFF" />
          </View>
          <Text style={[styles.pinLabel, { fontWeight: '700' }]}>Colégio</Text>
        </View>

        {/* Marcador da Van com Radar Pulse Apple */}
        <View style={styles.busMarkerWrap}>
          <View style={styles.radarRing} />
          <View style={styles.busBubble}>
            <Ionicons name="bus" size={18} color={colors.accentDark} />
          </View>
        </View>

        {/* Endereço Atual em Overlay Flutuante */}
        <View style={styles.addressFloatingPill}>
          <Ionicons name="navigate-circle" size={15} color={colors.accent} />
          <Text style={styles.addressText} numberOfLines={1}>
            {gpsPosicao.rua}
          </Text>
        </View>
      </View>

      {/* Barra de Telemetria e Indicadores (Velocidade, Precisão, Tempo Real) */}
      <View style={styles.telemetryBar}>
        <View style={styles.telemetryCell}>
          <Text style={styles.telemetryTitle}>Velocidade</Text>
          <Text style={styles.telemetryValue}>{gpsPosicao.velocidade} km/h</Text>
        </View>
        <View style={styles.telemetryDivider} />
        <View style={styles.telemetryCell}>
          <Text style={styles.telemetryTitle}>Precisão</Text>
          <Text style={styles.telemetryValue}>± 3.8m</Text>
        </View>
        <View style={styles.telemetryDivider} />
        <View style={styles.telemetryCell}>
          <Text style={styles.telemetryTitle}>Telemetria</Text>
          <Text style={styles.telemetryValue}>Baixa Latência</Text>
        </View>
      </View>

      {/* Ações com Microinteração AppleButton */}
      <View style={styles.actionsGrid}>
        <AppleButton
          variant="secondary"
          title="Avançar GPS (Simular)"
          icon={<Ionicons name="arrow-forward-circle-outline" size={17} color={colors.textPrimary} />}
          onPress={simularPassoGps}
          style={{ flex: 1 }}
        />

        {role === 'TRANSPORTADOR' && (
          <AppleButton
            variant={hornSent ? 'primary' : 'tonal'}
            title="Avisar Chegada"
            icon={<Ionicons name="notifications-outline" size={16} color={hornSent ? '#FFF' : colors.accentText} />}
            onPress={handleHorn}
            style={{ flex: 1 }}
          />
        )}
      </View>

      {/* Controles de Rota do Transportador (RF020, RF011) */}
      {role === 'TRANSPORTADOR' && (
        <View style={styles.driverSection}>
          {isEmAndamento ? (
            <View style={styles.driverButtonRow}>
              <AppleButton
                variant="secondary"
                title="Concluir Rota"
                icon={<Ionicons name="flag-outline" size={16} color={colors.textPrimary} />}
                onPress={finalizarViagem}
                style={{ flex: 1 }}
              />
              <AppleButton
                variant="destructive"
                title="Ocorrência"
                icon={<Ionicons name="warning-outline" size={16} color={colors.systemRed} />}
                onPress={onReportEmergency || (() => {})}
                style={{ flex: 1 }}
              />
            </View>
          ) : (
            <AppleButton
              variant="primary"
              title="Iniciar Rota Escolar"
              icon={<Ionicons name="play" size={16} color="#FFF" />}
              onPress={() => iniciarViagem('IDA', 'MANHA')}
              size="lg"
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 14,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  tripSub: {
    fontSize: 12,
    color: colors.textTertiary,
    letterSpacing: -0.1,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentUltraLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  etaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accentText,
    letterSpacing: -0.1,
  },
  mapCanvas: {
    height: 200,
    backgroundColor: '#E8EDF2',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 0.5,
    borderColor: '#D5DCE4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streetHorizontal1: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#D5DCE4',
  },
  streetHorizontal2: {
    position: 'absolute',
    top: 130,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#D5DCE4',
  },
  streetVertical1: {
    position: 'absolute',
    left: 65,
    top: 0,
    bottom: 0,
    width: 22,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: '#D5DCE4',
  },
  streetVertical2: {
    position: 'absolute',
    right: 80,
    top: 0,
    bottom: 0,
    width: 22,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: '#D5DCE4',
  },
  routePath: {
    position: 'absolute',
    top: 55,
    left: 70,
    width: 175,
    height: 85,
    borderLeftWidth: 3.5,
    borderBottomWidth: 3.5,
    borderColor: colors.accent,
    borderBottomLeftRadius: 18,
  },
  stopPin: {
    position: 'absolute',
    alignItems: 'center',
  },
  stopIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  pinLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  nextStopTag: {
    backgroundColor: colors.accentDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  nextStopTagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  busMarkerWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 80,
    left: '42%',
  },
  radarRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(217, 119, 6, 0.22)',
  },
  busBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.accent,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  addressFloatingPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  addressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    letterSpacing: -0.1,
  },
  telemetryBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  telemetryCell: {
    alignItems: 'center',
  },
  telemetryTitle: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  telemetryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  telemetryDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  driverSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
    borderTopColor: colors.border,
  },
  driverButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
