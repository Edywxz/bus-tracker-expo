/**
 * kit — ponto de entrada da UI do app.
 * Agora reexporta o design system (src/components/ds) e mantém só helpers de domínio.
 *
 * Migração (antes → depois):
 *  Card            → Card (padding 16, raio 20, sem borda; variante `signal`)
 *  Group / Row     → ListSection / ListRow (`icon` agora é IconName semântico; `left`→`leading`, `right`→`trailing`,
 *                     `destructive`→`role="destructive"`, `iconColor/iconBg`→`iconTone`)
 *  SectionLabel    → SectionHeader (`right` → `action={{ label, onPress }}`)
 *  Badge           → StatusPill (`color/bg` → `tone`)
 *  Segmented       → SegmentedControl
 *  Field           → TextField (`hint` → `helper`)
 *  Banner          → Notice
 *  AppleButton     → Button (`title`→`label`; primary→borderedProminent, secondary→bordered, tonal→tinted,
 *                     destructive→tinted + role="destructive", ghost→plain; `icon` agora é IconName)
 *  LargeTitleScreen→ Screen (cabeçalho nativo do Expo Router)
 *  ui/Sheet        → Sheet (sheet nativa iOS / bottom sheet Material)
 *  TouchableScale  → PressableScale
 *  Ionicons        → Icon (SF Symbols iOS / Material Symbols Android)
 */
import type { IconName, PillTone } from '../ds';

export * from '../ds';

export type StatusAluno = 'AGUARDANDO' | 'EMBARCADO' | 'DESEMBARCADO' | 'AUSENTE';

/** Estado de embarque → rótulo + tom da StatusPill. */
export function statusAluno(s: StatusAluno): { label: string; tone: PillTone; icon: IconName } {
  switch (s) {
    case 'EMBARCADO': return { label: 'A bordo', tone: 'success', icon: 'checkCircle' };
    case 'DESEMBARCADO': return { label: 'Na escola', tone: 'info', icon: 'school' };
    case 'AUSENTE': return { label: 'Faltou', tone: 'error', icon: 'closeCircle' };
    default: return { label: 'Aguardando', tone: 'neutral', icon: 'clock' };
  }
}
