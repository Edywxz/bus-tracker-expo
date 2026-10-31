import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface TimelineItemProps {
  title: string;
  subtitle?: string;
  timestamp: string;
  status: 'EMBARCADO' | 'DESEMBARCADO' | 'AUSENTE' | 'AGUARDANDO' | 'ALERTA';
  isLast?: boolean;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  title,
  subtitle,
  timestamp,
  status,
  isLast = false,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'EMBARCADO':
        return {
          icon: 'checkmark' as const,
          color: colors.systemGreen,
          bg: colors.systemGreenLight,
          label: 'Embarcou',
        };
      case 'DESEMBARCADO':
        return {
          icon: 'school' as const,
          color: colors.systemBlue,
          bg: colors.systemBlueLight,
          label: 'Desembarcou',
        };
      case 'AUSENTE':
        return {
          icon: 'close' as const,
          color: colors.systemRed,
          bg: colors.systemRedLight,
          label: 'Falta',
        };
      case 'ALERTA':
        return {
          icon: 'warning' as const,
          color: colors.systemOrange,
          bg: colors.systemOrangeLight,
          label: 'Atenção',
        };
      case 'AGUARDANDO':
      default:
        return {
          icon: 'time' as const,
          color: colors.textTertiary,
          bg: colors.surfaceSecondary,
          label: 'Aguardando',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={styles.container}>
      {/* Coluna da Linha do Tempo Apple */}
      <View style={styles.timelineColumn}>
        <View style={[styles.markerCircle, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={13} color={config.color} />
        </View>
        {!isLast && <View style={styles.verticalTrack} />}
      </View>

      {/* Conteúdo do Registro */}
      <View style={styles.contentColumn}>
        <View style={styles.contentHeader}>
          <Text style={styles.titleText}>{title}</Text>
          <View style={[styles.badge, { backgroundColor: config.bg }]}>
            <Text style={[styles.badgeText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
        <Text style={styles.timeText}>{timestamp}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  timelineColumn: {
    alignItems: 'center',
    width: 28,
    marginRight: 12,
  },
  markerCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  verticalTrack: {
    flex: 1,
    width: 1.5,
    backgroundColor: colors.border,
    marginTop: -2,
    marginBottom: -2,
  },
  contentColumn: {
    flex: 1,
    paddingBottom: 16,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  subtitleText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  timeText: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
    letterSpacing: -0.05,
  },
});
