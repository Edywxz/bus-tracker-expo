/**
 * VanEscolar GPS — Design tokens (espaçamento, raios, sombras, movimento)
 * Escala de 4pt. Nenhum valor visual repetido deve ficar fora deste arquivo.
 */
import { Easing, LayoutAnimation, Platform, UIManager } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const shadows = {
  /** Cartões em repouso: quase imperceptível */
  card: Platform.select({
    ios: {
      shadowColor: '#0B0B14',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 14,
    },
    android: { elevation: 1 },
    default: {},
  }),
  /** Elementos flutuantes: tab bar, botões de ação */
  floating: Platform.select({
    ios: {
      shadowColor: '#0B0B14',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: { elevation: 8 },
    default: {},
  }),
} as const;

/** Movimento: molas curtas e previsíveis, durações enxutas. */
export const motion = {
  duration: { fast: 140, base: 240, slow: 380 },
  spring: {
    /** Feedback de toque */
    press: { speed: 40, bounciness: 0 },
    /** Troca de aba / indicador */
    snappy: { speed: 18, bounciness: 6 },
    /** Entrada de conteúdo */
    gentle: { speed: 12, bounciness: 4 },
  },
  easing: Easing.bezier(0.22, 1, 0.36, 1), // easeOutQuint
  stagger: 55,
} as const;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Anima a próxima mudança de layout (listas, status, badges). */
export function animateNextLayout() {
  LayoutAnimation.configureNext({
    duration: 280,
    create: { type: 'easeInEaseOut', property: 'opacity' },
    update: { type: 'spring', springDamping: 0.82 },
    delete: { type: 'easeInEaseOut', property: 'opacity' },
  });
}

/** Preenche o pai (substitui StyleSheet.absoluteFillObject, removido no RN 0.88). */
export const fill = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;
