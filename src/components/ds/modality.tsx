/**
 * Apresentação modal: sheet, action sheet, alert, popover, context menu, share (activity view),
 * pop-up e pull-down menu buttons. Sempre o mecanismo nativo de cada plataforma quando existe.
 */
import React, { useRef, useState } from 'react';
import {
  ActionSheetIOS, Alert, AlertButton, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share,
  StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { elevation, fill, radius, spacing } from '../../theme/tokens';
import { type } from '../../theme/type';
import { GlassSurface } from './glass';
import { Icon, IconName } from './icon';
import { IconButton } from './button';
import { haptic } from './pressable';

/* ------------------------------------------------------------------ Sheet */
export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Ação principal fixa no rodapé. */
  footer?: React.ReactNode;
}

/**
 * Sheet nativa.
 * - iOS: UISheetPresentationController (`presentationStyle="pageSheet"`) — grabber, gesto de fechar e vidro do sistema no iOS 26.
 * - Android: bottom sheet Material (modal deslizante com cantos de 28dp e scrim; voltar fecha).
 * Fechar fica no topo (botão circular); a ação principal fica no rodapé.
 */
export const Sheet: React.FC<SheetProps> = ({ visible, onClose, title, subtitle, children, footer }) => {
  const insets = useSafeAreaInsets();
  const ios = Platform.OS === 'ios';
  const header = (
    <View style={sh.header}>
      <View style={{ flex: 1 }}>
        {title ? <Text style={sh.title} accessibilityRole="header">{title}</Text> : null}
        {subtitle ? <Text style={sh.subtitle}>{subtitle}</Text> : null}
      </View>
      <IconButton icon="close" label="Fechar" onPress={onClose} variant="gray" size="sm" />
    </View>
  );
  const body = (
    <>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={sh.body} automaticallyAdjustKeyboardInsets>
        {children}
      </ScrollView>
      {footer ? <View style={[sh.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>{footer}</View> : null}
    </>
  );

  if (ios) {
    return (
      <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet" allowSwipeDismissal>
        <View style={sh.iosRoot}>
          <View style={sh.grabber} />
          {header}
          {body}
        </View>
      </Modal>
    );
  }
  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" transparent statusBarTranslucent navigationBarTranslucent>
      <Pressable style={[fill, { backgroundColor: colors.scrim }]} onPress={onClose} accessibilityLabel="Fechar" />
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end' }} behavior="height" pointerEvents="box-none">
        <View style={[sh.androidSheet, { maxHeight: '92%' }]}>
          <View style={[sh.grabber, { marginTop: spacing.md }]} />
          {header}
          {body}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const sh = StyleSheet.create({
  iosRoot: { flex: 1, backgroundColor: colors.secondarySystemBg },
  androidSheet: { backgroundColor: colors.secondarySystemBg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, overflow: 'hidden', ...elevation.e3 },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: radius.full, backgroundColor: colors.fill1, marginTop: spacing.s6 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { ...type.title3, fontWeight: '700', color: colors.label },
  subtitle: { ...type.subheadline, color: colors.secondaryLabel, marginTop: 2 },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: spacing.lg },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, backgroundColor: colors.secondarySystemBg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
});

/* ------------------------------------------------------------------ Action sheet */
export interface SheetAction { label: string; role?: 'default' | 'destructive'; onPress: () => void }

/**
 * Ações ligadas a um contexto. iOS: action sheet nativa (ancorada no iPad).
 * Android: diálogo Material com as ações (o Android não tem action sheet).
 */
export function showActionSheet(opts: { title?: string; message?: string; actions: SheetAction[]; cancelLabel?: string }) {
  const { title, message, actions, cancelLabel = 'Cancelar' } = opts;
  if (Platform.OS === 'ios') {
    const labels = [...actions.map((a) => a.label), cancelLabel];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title, message, options: labels, cancelButtonIndex: labels.length - 1,
        destructiveButtonIndex: actions.map((a, i) => (a.role === 'destructive' ? i : -1)).filter((i) => i >= 0),
        tintColor: colors.primary,
      },
      (i) => { if (i < actions.length) actions[i].onPress(); },
    );
    return;
  }
  const buttons: AlertButton[] = [
    ...actions.map((a) => ({ text: a.label, style: a.role === 'destructive' ? 'destructive' as const : 'default' as const, onPress: a.onPress })),
    { text: cancelLabel, style: 'cancel' },
  ];
  Alert.alert(title ?? '', message, buttons, { cancelable: true });
}

/* ------------------------------------------------------------------ Alert */
/** Só para decisão crítica. Título curto + consequência. Retorna true se confirmou. */
export function confirm(opts: { title: string; message?: string; confirmLabel: string; destructive?: boolean; cancelLabel?: string }): Promise<boolean> {
  return new Promise((resolve) => {
    if (opts.destructive) haptic.warning();
    Alert.alert(opts.title, opts.message, [
      { text: opts.cancelLabel ?? 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: opts.confirmLabel, style: opts.destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

/** Aviso informativo com um botão. */
export function notify(title: string, message?: string) {
  Alert.alert(title, message);
}

/* ------------------------------------------------------------------ Activity view (share) */
/** Folha de compartilhamento do sistema (recibo, localização temporária). */
export async function share(opts: { message: string; title?: string; url?: string }) {
  try { await Share.share({ message: opts.message, title: opts.title, url: opts.url }, { dialogTitle: opts.title }); } catch { /* cancelado */ }
}

/* ------------------------------------------------------------------ Pop-up / pull-down menu button */
export interface MenuOption<T extends string = string> { value: T; label: string; role?: 'default' | 'destructive' }

/**
 * Pop-up button: mostra o valor atual (com chevrons ↕) e escolhe entre opções exclusivas.
 * Abre a action sheet nativa (iOS) / diálogo (Android).
 */
export function PopupButton<T extends string>({ options, value, onChange, title }: { options: MenuOption<T>[]; value: T; onChange: (v: T) => void; title?: string }) {
  const cur = options.find((o) => o.value === value);
  return (
    <Pressable
      onPress={() => showActionSheet({ title, actions: options.map((o) => ({ label: o.value === value ? `✓ ${o.label}` : o.label, onPress: () => onChange(o.value) })) })}
      hitSlop={8} style={pb.btn} accessibilityRole="button" accessibilityLabel={`${title ?? 'Opção'}: ${cur?.label ?? ''}`}>
      <Text style={pb.text} numberOfLines={1}>{cur?.label ?? '—'}</Text>
      <Icon name="chevronUpDown" size={13} color={colors.secondaryLabel} weight="semibold" />
    </Pressable>
  );
}

/** Pull-down menu: botão (geralmente "…" na barra) que abre uma lista de ações. */
export const PullDownButton: React.FC<{ icon?: IconName; label: string; title?: string; actions: SheetAction[] }> = ({ icon = 'more', label, title, actions }) => (
  <IconButton icon={icon} label={label} onPress={() => showActionSheet({ title, actions })} variant="gray" />
);

const pb = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 44, paddingLeft: spacing.sm },
  text: { ...type.body, color: colors.secondaryLabel, maxWidth: 180 },
});

/* ------------------------------------------------------------------ Context menu */
/** Toque longo → ações contextuais (com haptic). Para rotas, prefira Link.Menu do Expo Router (prévia nativa no iOS). */
export const ContextMenu: React.FC<{ actions: SheetAction[]; title?: string; children: React.ReactElement<{ onLongPress?: () => void }> }> = ({ actions, title, children }) =>
  React.cloneElement(children, { onLongPress: () => { haptic.light(); showActionSheet({ title, actions }); } });

/* ------------------------------------------------------------------ Popover */
/**
 * Informação leve ancorada a um controle (ex.: "como calculamos o tempo").
 * No iPhone o HIG recomenda sheet para conteúdo maior; isto é para dicas curtas.
 */
export const Popover: React.FC<{ title: string; message: string; children: (open: () => void) => React.ReactNode }> = ({ title, message, children }) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const anchor = useRef<React.ComponentRef<typeof View>>(null);
  const open = () => anchor.current?.measureInWindow((x: number, y: number, w: number, h: number) => setPos({ x: Math.max(spacing.lg, x + w / 2 - 140), y: y + h + 10 }));
  return (
    <>
      <View ref={anchor} collapsable={false}>{children(open)}</View>
      <Modal visible={!!pos} transparent animationType="fade" onRequestClose={() => setPos(null)}>
        <Pressable style={fill} onPress={() => setPos(null)} accessibilityLabel="Fechar" />
        {pos ? (
          <GlassSurface material="thick" style={[po.card, { left: pos.x, top: pos.y }]}>
            <View style={{ padding: spacing.lg }} accessibilityLiveRegion="polite">
              <Text style={po.title}>{title}</Text>
              <Text style={po.msg}>{message}</Text>
            </View>
          </GlassSurface>
        ) : null}
      </Modal>
    </>
  );
};
const po = StyleSheet.create({
  card: { position: 'absolute', width: 280, borderRadius: radius.lg },
  title: { ...type.headline, color: colors.label },
  msg: { ...type.footnote, color: colors.secondaryLabel, marginTop: spacing.xs },
});
