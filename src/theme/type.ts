import { TextStyle } from 'react-native';

/** Rampa tipográfica (espelha os text styles da Apple). Cor fica por conta de quem usa. */
export const type = {
  largeTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.6 },
  title3: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  headline: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22, letterSpacing: -0.2 },
  callout: { fontSize: 15, fontWeight: '500', letterSpacing: -0.2 },
  subhead: { fontSize: 14, fontWeight: '400', lineHeight: 19, letterSpacing: -0.1 },
  footnote: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '600', letterSpacing: 0.1 },
} as const satisfies Record<string, TextStyle>;
