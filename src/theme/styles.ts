import { StyleSheet, Platform } from 'react-native';
import { colors } from './colors';
import { radius, shadows, spacing } from './tokens';

export const globalStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },

  // Apple Inset Grouped Card (Design limpo, minimalista e premium)
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    padding: 18,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.card,
  },

  cardElevated: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    padding: 20,
    marginBottom: spacing.lg,
    ...shadows.floating,
  },

  // Tipografia Apple HIG
  largeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  title1: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  title2: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  title3: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headline: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  callout: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: -0.1,
  },
  subhead: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textTertiary,
    letterSpacing: -0.05,
  },
  footnote: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textTertiary,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textTertiary,
    letterSpacing: 0.1,
  },

  // Cabeçalho de Seção Inset Grouped Apple
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 6,
  },

  // Badges e Pílulas Elegantes
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Segmented Control (Padrão iOS)
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E9E9EE',
    borderRadius: radius.md,
    padding: 3,
    marginBottom: 16,
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  segmentedButtonActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  segmentedText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: -0.1,
  },
  segmentedTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },

  // Inputs Estilo iOS (Campos limpos com borda sutil ou fundo suave)
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginLeft: 2,
  },
  divider: {
    height: Platform.OS === 'ios' ? 0.5 : 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
});
