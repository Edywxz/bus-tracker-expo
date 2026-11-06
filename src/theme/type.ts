import { Platform, TextStyle } from 'react-native';

/**
 * Estilos de texto HIG (tamanho padrão de Dynamic Type "Large").
 * iOS usa SF Pro do sistema; Android usa Roboto do sistema com o mesmo tamanho/peso.
 * A cor fica por conta de quem usa (sempre um token de `colors`).
 */
const rounded = Platform.select<TextStyle>({ ios: { fontFamily: 'ui-rounded' }, default: {} });

export const type = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '800', letterSpacing: -0.75 },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.3 },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: -0.24 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.41 },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400', letterSpacing: -0.41 },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400', letterSpacing: -0.32 },
  subheadline: { fontSize: 15, lineHeight: 20, fontWeight: '400', letterSpacing: -0.23 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: -0.08 },
  caption1: { fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0 },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '500', letterSpacing: 0.07 },
  /** ETA — o único número grande por tela. SF Rounded no iOS, tabular. */
  eta: { fontSize: 56, lineHeight: 60, fontWeight: '800', letterSpacing: -2, fontVariant: ['tabular-nums'], ...rounded },
  /** Valores em dinheiro em destaque. */
  amount: { fontSize: 40, lineHeight: 44, fontWeight: '700', letterSpacing: -1.2, fontVariant: ['tabular-nums'], ...rounded },
  /** Rótulo de seção (cabeçalho de lista agrupada). */
  sectionHeader: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0.26, textTransform: 'uppercase' },
} as const satisfies Record<string, TextStyle>;

/** Números alinhados (contadores, horários, valores). */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

/** Limite de escala de fonte para chrome compacto (abas, pílulas). Conteúdo não limita abaixo de 1.3. */
export const maxScaleCompact = 1.3;
