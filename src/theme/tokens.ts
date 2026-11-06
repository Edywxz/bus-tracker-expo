/**
 * VanEscolar GPS — Design System "Faixa escolar" · espaçamento, forma, elevação, movimento.
 * Ritmo de 4/8pt. Nenhum valor visual repetido deve ficar fora deste arquivo.
 */
import { Easing, LayoutAnimation, Platform, UIManager } from 'react-native';

/** Escala base (4/8pt). Chaves curtas mantidas por compatibilidade: xs=4 … xxxl=32. */
export const spacing = {
  xxs: 2, xs: 4, s6: 6, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48, giant: 64,
} as const;

/** Papéis semânticos de espaçamento: relacionado < seção < maior. */
export const gap = {
  related: spacing.sm,   // rótulo ↔ valor, itens de um grupo
  section: spacing.xxl,  // entre grupos de conteúdo
  major: spacing.xxxl,   // entre seções maiores
} as const;

/** Layout (pt). */
export const layout = {
  gutter: 16,        // margem lateral do iPhone
  rowMin: 44,        // altura mínima de linha
  rowInset: 16,      // recuo do conteúdo da linha
  targetMin: 44,     // alvo de toque mínimo (HIG 44pt · Material 48dp — usamos 48 no Android)
  targetMinAndroid: 48,
  barHeight: 44,
  tabBarHeight: 62,
  floatInset: 16,
} as const;

export const hitTarget = Platform.OS === 'android' ? layout.targetMinAndroid : layout.targetMin;

/** Raios contínuos (use sempre com `borderCurve: 'continuous'`). */
export const radius = {
  none: 0, xs: 6, sm: 8, md: 12, lg: 20, xl: 28, sheet: 34, full: 999,
} as const;

/**
 * Elevação: profundidade vem do vidro; conteúdo quase plano.
 * Use via spread: `{ ...elevation.e1 }` (CSS boxShadow — nunca as props shadow… / elevation legadas).
 */
export const elevation = {
  e0: {},
  e1: { boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.05)' },
  e2: { boxShadow: '0 8px 28px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.06)' },
  e3: { boxShadow: '0 -2px 30px rgba(0,0,0,0.16), 0 0 1px rgba(0,0,0,0.10)' },
} as const;

/** Estados de interação. */
export const state = {
  pressedScale: 0.97,
  pressedDim: 0.72,
  disabledOpacity: 0.38,
} as const;

/** Ícones (SF Symbols no iOS · Material Symbols no Android). */
export const iconSize = {
  inline: 17,
  base: 22,
  large: 28,
  tab: 24,
} as const;

/** Movimento: durações enxutas, easeOutQuint e mola com leve overshoot. */
export const motion = {
  duration: { fast: 150, base: 250, slow: 400 },
  easing: Easing.bezier(0.22, 1, 0.36, 1),
  easingSpring: Easing.bezier(0.34, 1.4, 0.5, 1),
  spring: {
    /** Feedback de toque */
    press: { speed: 40, bounciness: 0 },
    /** Troca de aba / indicador */
    snappy: { speed: 18, bounciness: 6 },
    /** Entrada de conteúdo */
    gentle: { speed: 12, bounciness: 4 },
  },
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
