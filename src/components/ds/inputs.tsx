/**
 * Entradas: text field, text editor, search bar, chip (extensão), pickers (data inline, hora, roda).
 */
import React, { useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View,
} from 'react-native';
import { colors } from '../../theme/colors';
import { hitTarget, radius, spacing } from '../../theme/tokens';
import { type } from '../../theme/type';
import { Icon, IconName } from './icon';
import { haptic, PressableScale } from './pressable';

/* ------------------------------------------------------------------ Text field */
export interface TextFieldProps extends TextInputProps {
  label: string;
  helper?: string;
  error?: string | null;
  icon?: IconName;
  readOnly?: boolean;
  disabled?: boolean;
  inputRef?: React.Ref<React.ComponentRef<typeof TextInput>>;
}

/** Rótulo acima (13pt), campo de 44pt, ajuda/erro abaixo. Estados: vazio, foco, preenchido, erro, desabilitado, somente leitura. */
export const TextField: React.FC<TextFieldProps> = ({
  label, helper, error, icon, readOnly, disabled, secureTextEntry, style, inputRef, multiline, ...rest
}) => {
  const [focus, setFocus] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const border = error ? colors.error : focus ? colors.primary : 'transparent';
  return (
    <View style={[{ gap: spacing.s6 }, disabled && { opacity: 0.38 }]}>
      <Text style={f.label}>{label}</Text>
      <View style={[f.box, multiline && f.multi, { borderColor: border }]}>
        {readOnly ? <Icon name="lock" size={16} color={colors.tertiaryLabel} /> : icon ? <Icon name={icon} size={18} color={colors.tertiaryLabel} /> : null}
        <TextInput
          ref={inputRef}
          {...rest}
          multiline={multiline}
          editable={!readOnly && !disabled && rest.editable !== false}
          secureTextEntry={hidden}
          placeholderTextColor={colors.tertiaryLabel}
          selectionColor={Platform.OS === 'ios' ? colors.primary : colors.signal}
          cursorColor={colors.primary}
          onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
          style={[f.input, multiline && { textAlignVertical: 'top', minHeight: 64 }, style]}
          accessibilityLabel={label}
          accessibilityHint={error ?? helper}
        />
        {secureTextEntry ? (
          <PressableScale onPress={() => setHidden((h) => !h)} hitSlop={10} accessibilityRole="button" accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}>
            <Icon name={hidden ? 'eye' : 'eyeOff'} size={20} color={colors.secondaryLabel} />
          </PressableScale>
        ) : null}
      </View>
      {error ? <Text style={f.error} accessibilityLiveRegion="polite">{error}</Text> : helper ? <Text style={f.help}>{helper}</Text> : null}
    </View>
  );
};

/** Texto multilinha com contador (observação de falta, ocorrência). */
export const TextEditor: React.FC<Omit<TextFieldProps, 'multiline'> & { maxLength?: number }> = ({ maxLength = 280, value, ...rest }) => (
  <View>
    <TextField {...rest} value={value} multiline maxLength={maxLength} style={{ minHeight: 88 }} />
    <Text style={f.count}>{(value ?? '').length}/{maxLength}</Text>
  </View>
);

const f = StyleSheet.create({
  label: { ...type.footnote, color: colors.secondaryLabel, paddingHorizontal: spacing.xs },
  box: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: hitTarget, paddingHorizontal: spacing.lg,
    borderRadius: radius.md, borderCurve: 'continuous', backgroundColor: colors.secondaryGroupedBg, borderWidth: 1.5,
  },
  multi: { alignItems: 'flex-start', paddingVertical: spacing.sm },
  input: { flex: 1, ...type.body, color: colors.label, paddingVertical: Platform.OS === 'ios' ? 11 : 8 },
  help: { ...type.footnote, color: colors.secondaryLabel, paddingHorizontal: spacing.xs },
  error: { ...type.footnote, color: colors.error, paddingHorizontal: spacing.xs },
  count: { ...type.caption1, color: colors.secondaryLabel, alignSelf: 'flex-end', marginTop: spacing.xs, fontVariant: ['tabular-nums'] },
});

/* ------------------------------------------------------------------ Search bar */
/**
 * Campo de busca em cápsula. Em telas com cabeçalho nativo prefira `headerSearchBarOptions`
 * (busca do sistema); use este componente dentro de conteúdo ou sheets.
 */
export const SearchBar: React.FC<{ value: string; onChangeText: (t: string) => void; placeholder?: string }> = ({ value, onChangeText, placeholder = 'Buscar' }) => {
  const [focus, setFocus] = useState(false);
  const ref = useRef<React.ComponentRef<typeof TextInput>>(null);
  return (
    <View style={sb.row}>
      <View style={sb.field}>
        <Icon name="search" size={17} color={colors.secondaryLabel} />
        <TextInput ref={ref} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.secondaryLabel}
          style={sb.input} returnKeyType="search" onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} accessibilityLabel={placeholder} />
        {value ? (
          <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Limpar busca">
            <Icon name="closeCircle" size={17} color={colors.tertiaryLabel} />
          </Pressable>
        ) : null}
      </View>
      {focus ? (
        <Pressable onPress={() => { onChangeText(''); ref.current?.blur(); }} hitSlop={8} accessibilityRole="button">
          <Text style={sb.cancel}>Cancelar</Text>
        </Pressable>
      ) : null}
    </View>
  );
};
const sb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  field: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.s6, height: 36, paddingHorizontal: spacing.sm, borderRadius: radius.full, backgroundColor: colors.fill3 },
  input: { flex: 1, ...type.body, color: colors.label, paddingVertical: 0 },
  cancel: { ...type.body, color: colors.primaryInk },
});

/* ------------------------------------------------------------------ Chip (extensão) */
/** Cápsula selecionável para escolhas curtas em formulários (aluno, turno, tipo de ocorrência). Selecionada = tinta. */
export const Chip: React.FC<{ label: string; selected?: boolean; onPress: () => void; icon?: IconName }> = ({ label, selected, onPress, icon }) => (
  <PressableScale onPress={() => { haptic.selection(); onPress(); }} accessibilityRole="button" accessibilityState={{ selected }}
    style={[ch.chip, selected && ch.on]}>
    {icon ? <Icon name={icon} size={15} color={selected ? colors.onPrimary : colors.label} /> : null}
    <Text style={[ch.text, selected && { color: colors.onPrimary }]}>{label}</Text>
  </PressableScale>
);
const ch = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.s6, minHeight: 36, paddingHorizontal: spacing.md, borderRadius: radius.full, backgroundColor: colors.fill3 },
  on: { backgroundColor: colors.primary },
  text: { ...type.subheadline, fontWeight: '500', color: colors.label },
});

/* ------------------------------------------------------------------ Pickers */
const DOW = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Calendário inline (pontos amarelos = eventos/recessos). */
export const DatePickerInline: React.FC<{ value: Date; onChange: (d: Date) => void; events?: string[] /* ISO yyyy-mm-dd */ }> = ({ value, onChange, events = [] }) => {
  const [month, setMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1));
  const days = useMemo(() => {
    const first = month.getDay();
    const n = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: n }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  }, [month]);
  const today = iso(new Date());
  const sel = iso(value);
  const shift = (d: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + d, 1));
  return (
    <View>
      <View style={dp.head}>
        <Text style={dp.month}>{MESES[month.getMonth()]} {month.getFullYear()}</Text>
        <View style={{ flexDirection: 'row', gap: spacing.xl }}>
          <Pressable onPress={() => shift(-1)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Mês anterior"><Icon name="chevronLeft" size={20} color={colors.primaryInk} weight="semibold" /></Pressable>
          <Pressable onPress={() => shift(1)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Próximo mês"><Icon name="chevronRight" size={20} color={colors.primaryInk} weight="semibold" /></Pressable>
        </View>
      </View>
      <View style={dp.grid}>
        {DOW.map((d, i) => <Text key={`h${i}`} style={dp.dow}>{d}</Text>)}
        {days.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={dp.cell} />;
          const k = iso(d); const isSel = k === sel; const isToday = k === today; const ev = events.includes(k);
          return (
            <Pressable key={k} style={dp.cell} onPress={() => { haptic.selection(); onChange(d); }}
              accessibilityRole="button" accessibilityState={{ selected: isSel }} accessibilityLabel={`${d.getDate()} de ${MESES[d.getMonth()]}${ev ? ', com evento' : ''}`}>
              <View style={[dp.day, isSel && { backgroundColor: colors.primary }]}>
                <Text style={[dp.dayText, isToday && { color: colors.primaryInk, fontWeight: '600' }, isSel && { color: colors.onPrimary, fontWeight: '600' }]}>{d.getDate()}</Text>
              </View>
              {ev ? <View style={dp.dot} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
const dp = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xs, paddingBottom: spacing.md },
  month: { ...type.headline, color: colors.label },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dow: { width: `${100 / 7}%`, textAlign: 'center', ...type.footnote, fontWeight: '600', color: colors.secondaryLabel, paddingBottom: spacing.xs },
  cell: { width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'center' },
  day: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  dayText: { ...type.title3, fontWeight: '400', color: colors.label, fontVariant: ['tabular-nums'] },
  dot: { position: 'absolute', bottom: 3, width: 5, height: 5, borderRadius: radius.full, backgroundColor: colors.signal },
});

/** Valor compacto em pílula (hora/data) — toque abre o seletor do app. */
export const ValuePill: React.FC<{ label: string; active?: boolean; onPress?: () => void; accessibilityLabel?: string }> = ({ label, active, onPress, accessibilityLabel }) => (
  <Pressable onPress={onPress} disabled={!onPress} hitSlop={6} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}
    style={{ height: 34, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.fill3, justifyContent: 'center' }}>
    <Text style={{ ...type.body, color: active ? colors.primaryInk : colors.label, fontWeight: active ? '600' : '400', fontVariant: ['tabular-nums'] }}>{label}</Text>
  </Pressable>
);

/** Roda para listas curtas (parentesco, turno). */
export function WheelPicker<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const ROW = 34;
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const end = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.min(options.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ROW)));
    if (options[i].value !== value) { haptic.selection(); onChange(options[i].value); }
  };
  return (
    <View style={{ height: ROW * 5, justifyContent: 'center' }} accessibilityRole="adjustable" accessibilityValue={{ text: options[idx]?.label }}>
      <View pointerEvents="none" style={{ position: 'absolute', left: spacing.sm, right: spacing.sm, height: ROW, borderRadius: radius.sm, backgroundColor: colors.fill3 }} />
      <ScrollView showsVerticalScrollIndicator={false} snapToInterval={ROW} decelerationRate="fast" onMomentumScrollEnd={end}
        contentOffset={{ x: 0, y: idx * ROW }} contentContainerStyle={{ paddingVertical: ROW * 2 }}>
        {options.map((o) => (
          <View key={o.value} style={{ height: ROW, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ ...type.title3, fontWeight: '400', color: o.value === value ? colors.label : colors.secondaryLabel }}>{o.label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
