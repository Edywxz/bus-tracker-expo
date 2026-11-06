import React from 'react';
import { ColorValue, StyleProp, ViewStyle } from 'react-native';
import { SymbolView, type SFSymbol, type AndroidSymbol, type SymbolWeight } from 'expo-symbols';
import { colors } from '../../theme/colors';
import { iconSize } from '../../theme/tokens';

/**
 * Registro semântico de ícones do app.
 * iOS → SF Symbols · Android/web → Material Symbols (renderizados nativamente pelo expo-symbols).
 * Para adicionar um ícone: escolha o nome no app SF Symbols e em fonts.google.com/icons e registre aqui.
 */
export const ICONS = {
  van: { ios: 'bus.fill', android: 'directions_bus' },
  vanOutline: { ios: 'bus', android: 'directions_bus' },
  map: { ios: 'map', android: 'map' },
  navigate: { ios: 'location.north.fill', android: 'navigation' },
  location: { ios: 'location', android: 'location_on' },
  home: { ios: 'house', android: 'home' },
  homeFill: { ios: 'house.fill', android: 'home' },
  school: { ios: 'graduationcap', android: 'school' },
  person: { ios: 'person', android: 'person' },
  personAdd: { ios: 'person.badge.plus', android: 'person_add' },
  people: { ios: 'person.2', android: 'group' },
  account: { ios: 'person.crop.circle', android: 'account_circle' },
  messages: { ios: 'bubble.left.and.bubble.right', android: 'forum' },
  chat: { ios: 'ellipsis.message', android: 'chat' },
  bell: { ios: 'bell', android: 'notifications' },
  bellOff: { ios: 'bell.slash', android: 'notifications_off' },
  megaphone: { ios: 'megaphone', android: 'campaign' },
  wallet: { ios: 'wallet.bifold', android: 'account_balance_wallet' },
  card: { ios: 'creditcard', android: 'credit_card' },
  cash: { ios: 'banknote', android: 'payments' },
  qr: { ios: 'qrcode', android: 'qr_code_2' },
  doc: { ios: 'doc.text', android: 'description' },
  receipt: { ios: 'receipt', android: 'receipt_long' },
  calendar: { ios: 'calendar', android: 'calendar_today' },
  clock: { ios: 'clock', android: 'schedule' },
  hourglass: { ios: 'hourglass', android: 'hourglass_empty' },
  shield: { ios: 'checkmark.shield', android: 'verified_user' },
  lock: { ios: 'lock', android: 'lock' },
  key: { ios: 'key', android: 'key' },
  eye: { ios: 'eye', android: 'visibility' },
  eyeOff: { ios: 'eye.slash', android: 'visibility_off' },
  medical: { ios: 'cross.case', android: 'medical_services' },
  alert: { ios: 'exclamationmark.circle', android: 'error' },
  warning: { ios: 'exclamationmark.triangle', android: 'warning' },
  info: { ios: 'info.circle', android: 'info' },
  offline: { ios: 'icloud.slash', android: 'cloud_off' },
  flag: { ios: 'flag.checkered', android: 'flag' },
  play: { ios: 'play.fill', android: 'play_arrow' },
  pause: { ios: 'pause.circle', android: 'pause_circle' },
  live: { ios: 'dot.radiowaves.left.and.right', android: 'sensors' },
  forward: { ios: 'arrow.forward.circle', android: 'arrow_circle_right' },
  arrowUp: { ios: 'arrow.up', android: 'arrow_upward' },
  login: { ios: 'arrow.right.circle', android: 'login' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
  mail: { ios: 'envelope', android: 'mail' },
  mailOpen: { ios: 'envelope.open', android: 'drafts' },
  phone: { ios: 'phone', android: 'call' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  copy: { ios: 'doc.on.doc', android: 'content_copy' },
  search: { ios: 'magnifyingglass', android: 'search' },
  mic: { ios: 'mic', android: 'mic' },
  gear: { ios: 'gearshape', android: 'settings' },
  edit: { ios: 'pencil', android: 'edit' },
  trash: { ios: 'trash', android: 'delete' },
  plus: { ios: 'plus', android: 'add' },
  minus: { ios: 'minus', android: 'remove' },
  check: { ios: 'checkmark', android: 'check' },
  checkCircle: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  checkDone: { ios: 'checkmark.circle', android: 'done_all' },
  circle: { ios: 'circle', android: 'radio_button_unchecked' },
  close: { ios: 'xmark', android: 'close' },
  closeCircle: { ios: 'xmark.circle.fill', android: 'cancel' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more' },
  chevronUpDown: { ios: 'chevron.up.chevron.down', android: 'unfold_more' },
  more: { ios: 'ellipsis', android: 'more_horiz' },
  steering: { ios: 'steeringwheel', android: 'directions_car' },
} as const satisfies Record<string, { ios: SFSymbol; android: AndroidSymbol }>;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
  weight?: SymbolWeight;
  style?: StyleProp<ViewStyle>;
  /** Rótulo para leitores de tela. Sem rótulo, o ícone é decorativo. */
  accessibilityLabel?: string;
}

/** Ícone nativo: SF Symbol no iOS, Material Symbol no Android/web. */
export const Icon: React.FC<IconProps> = ({ name, size = iconSize.base, color = colors.label, weight = 'regular', style, accessibilityLabel }) => {
  const sym = ICONS[name];
  return (
    <SymbolView
      name={{ ios: sym.ios, android: sym.android, web: sym.android }}
      size={size}
      tintColor={color}
      weight={weight}
      resizeMode="scaleAspectFit"
      style={[{ width: size, height: size }, style]}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    />
  );
};
