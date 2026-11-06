/**
 * VanEscolar GPS — Design System "Faixa escolar" · cores
 * Referência: Apple HIG (iOS 26) com equivalentes Material no Android.
 * Fonte da verdade: design-system/styles.css (contraste WCAG verificado por cálculo).
 *
 * Regras
 * - UMA família de ação: tinta (`primary`). Amarelo (`signal`) marca só a van ao vivo, o ETA e "a caminho".
 * - Todo preenchimento tem seu par `on*`. Texto amarelo sobre branco usa `signalInk`.
 * - Status (success/warning/error/info) sempre acompanhado de texto.
 * - Componentes leem cores por nome — nunca hex solto em tela.
 */
import { useColorScheme } from 'react-native';

export interface Palette {
  /* interação (tinta) */
  primary: string; onPrimary: string; primaryStrong: string; primaryInk: string;
  primaryContainer: string; onPrimaryContainer: string; tint: string;
  /* sinal (amarelo escolar) */
  signal: string; onSignal: string; signalInk: string; signalContainer: string; onSignalContainer: string;
  /* status */
  success: string; onSuccess: string; successContainer: string; onSuccessContainer: string;
  warning: string; onWarning: string; warningContainer: string; onWarningContainer: string;
  error: string; onError: string; errorContainer: string; onErrorContainer: string;
  info: string; onInfo: string; infoContainer: string; onInfoContainer: string; link: string;
  /* HIG labels */
  label: string; secondaryLabel: string; tertiaryLabel: string; quaternaryLabel: string;
  /* HIG backgrounds */
  systemBg: string; secondarySystemBg: string; tertiarySystemBg: string;
  groupedBg: string; secondaryGroupedBg: string; tertiaryGroupedBg: string;
  /* separadores e preenchimentos */
  separator: string; opaqueSeparator: string; fill1: string; fill2: string; fill3: string; fill4: string;
  /* cores de sistema */
  sysRed: string; sysOrange: string; sysYellow: string; sysGreen: string; sysMint: string; sysTeal: string;
  sysCyan: string; sysBlue: string; sysIndigo: string; sysPurple: string; sysPink: string; sysBrown: string;
  /* mapa */
  mapLand: string; mapRoad: string; mapRoadEdge: string; mapPark: string; mapWater: string; route: string; routeDone: string;
  /* materiais (Liquid Glass / fallback translúcido) */
  matUltraThin: string; matThin: string; matRegular: string; matThick: string; matChrome: string;
  glassTintProminent: string; glassEdge: string; scrim: string;
  /* constantes */
  white: string; black: string;
}

export const light: Palette = {
  primary: '#111113', onPrimary: '#FFFFFF', primaryStrong: '#000000', primaryInk: '#111113',
  primaryContainer: '#E9E9EE', onPrimaryContainer: '#111113', tint: '#111113',

  signal: '#F5B400', onSignal: '#1A1300', signalInk: '#8A5A00', signalContainer: '#FFF4CC', onSignalContainer: '#5C3D00',

  success: '#1E7B34', onSuccess: '#FFFFFF', successContainer: '#E3F5E8', onSuccessContainer: '#1B6B30',
  warning: '#C93400', onWarning: '#FFFFFF', warningContainer: '#FFF0E5', onWarningContainer: '#9A3A00',
  error: '#D70015', onError: '#FFFFFF', errorContainer: '#FDECEC', onErrorContainer: '#B0000F',
  info: '#0066CC', onInfo: '#FFFFFF', infoContainer: '#E6F0FA', onInfoContainer: '#00519F', link: '#0066CC',

  label: '#111113', secondaryLabel: '#5E5E66', tertiaryLabel: '#8E8E93', quaternaryLabel: '#C7C7CC',

  systemBg: '#FFFFFF', secondarySystemBg: '#F2F2F7', tertiarySystemBg: '#FFFFFF',
  groupedBg: '#F2F2F7', secondaryGroupedBg: '#FFFFFF', tertiaryGroupedBg: '#F2F2F7',

  separator: 'rgba(60,60,67,0.29)', opaqueSeparator: '#C6C6C8',
  fill1: 'rgba(120,120,128,0.20)', fill2: 'rgba(120,120,128,0.16)', fill3: 'rgba(118,118,128,0.12)', fill4: 'rgba(116,116,128,0.08)',

  sysRed: '#D70015', sysOrange: '#C93400', sysYellow: '#F5B400', sysGreen: '#1E7B34', sysMint: '#0C817B', sysTeal: '#008299',
  sysCyan: '#0071A4', sysBlue: '#0066CC', sysIndigo: '#3634A3', sysPurple: '#8944AB', sysPink: '#D30F45', sysBrown: '#7F6545',

  mapLand: '#EEF0EC', mapRoad: '#FFFFFF', mapRoadEdge: '#DADDD6', mapPark: '#DDEBD6', mapWater: '#CFE2F3', route: '#111113', routeDone: '#B9BBC2',

  matUltraThin: 'rgba(255,255,255,0.38)', matThin: 'rgba(255,255,255,0.55)', matRegular: 'rgba(255,255,255,0.70)',
  matThick: 'rgba(255,255,255,0.84)', matChrome: 'rgba(249,249,251,0.78)',
  glassTintProminent: 'rgba(17,17,19,0.86)', glassEdge: 'rgba(255,255,255,0.75)', scrim: 'rgba(0,0,0,0.30)',

  white: '#FFFFFF', black: '#000000',
};

export const dark: Palette = {
  ...light,
  primary: '#F5F5F7', onPrimary: '#111113', primaryStrong: '#FFFFFF', primaryInk: '#F5F5F7',
  primaryContainer: '#2C2C2E', onPrimaryContainer: '#F5F5F7', tint: '#F5F5F7',

  signal: '#FFC21A', onSignal: '#1A1300', signalInk: '#FFC21A', signalContainer: '#3A2E0A', onSignalContainer: '#FFD45C',

  success: '#30D158', onSuccess: '#0A2E12', successContainer: '#12351C', onSuccessContainer: '#7CE38F',
  warning: '#FF9F0A', onWarning: '#2A1800', warningContainer: '#3A2410', onWarningContainer: '#FFB35C',
  error: '#FF6961', onError: '#2A0705', errorContainer: '#3A1412', onErrorContainer: '#FF8A80',
  info: '#4DA3FF', onInfo: '#001A33', infoContainer: '#0E2A47', onInfoContainer: '#8CC4FF', link: '#4DA3FF',

  label: '#F5F5F7', secondaryLabel: '#AEAEB2', tertiaryLabel: '#8E8E93', quaternaryLabel: '#48484A',

  systemBg: '#000000', secondarySystemBg: '#1C1C1E', tertiarySystemBg: '#2C2C2E',
  groupedBg: '#000000', secondaryGroupedBg: '#1C1C1E', tertiaryGroupedBg: '#2C2C2E',

  separator: 'rgba(84,84,88,0.60)', opaqueSeparator: '#38383A',
  fill1: 'rgba(120,120,128,0.36)', fill2: 'rgba(120,120,128,0.32)', fill3: 'rgba(118,118,128,0.24)', fill4: 'rgba(118,118,128,0.18)',

  sysRed: '#FF6961', sysOrange: '#FF9F0A', sysYellow: '#FFC21A', sysGreen: '#30D158', sysMint: '#66D4CF', sysTeal: '#5DE6FF',
  sysCyan: '#70D7FF', sysBlue: '#4DA3FF', sysIndigo: '#7D7AFF', sysPurple: '#DA8FFF', sysPink: '#FF6482', sysBrown: '#B59469',

  mapLand: '#1A1C1E', mapRoad: '#2E3134', mapRoadEdge: '#25282B', mapPark: '#1C2A1F', mapWater: '#13263A', route: '#F5F5F7', routeDone: '#48484A',

  matUltraThin: 'rgba(28,28,30,0.40)', matThin: 'rgba(28,28,30,0.55)', matRegular: 'rgba(30,30,32,0.66)',
  matThick: 'rgba(30,30,32,0.82)', matChrome: 'rgba(22,22,24,0.74)',
  glassTintProminent: 'rgba(245,245,247,0.90)', glassEdge: 'rgba(255,255,255,0.14)', scrim: 'rgba(0,0,0,0.55)',
};

/**
 * Paleta ativa. O app está em modo claro (app.json → userInterfaceStyle "light"),
 * então `colors` é a paleta clara. Para suportar modo escuro, troque para `useColors()`
 * nos componentes e mude o app.json para "automatic".
 */
export const colors: Palette = light;

/** Paleta conforme o esquema do sistema (respeita o userInterfaceStyle do app.json). */
export function useColors(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}
