import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { motion, radius } from '../theme/tokens';
import { type } from '../theme/type';

const HEIGHT = 230;
// Pontos esquemáticos da rota (fração da largura, y em px)
const PATH = [
  { x: 0.1, y: 52 }, { x: 0.27, y: 82 }, { x: 0.45, y: 112 }, { x: 0.62, y: 140 }, { x: 0.78, y: 172 },
];
const DESTINO = { x: 0.9, y: 196 };

export interface MapPin { nome: string; status: 'AGUARDANDO' | 'EMBARCADO' | 'DESEMBARCADO' | 'AUSENTE' }

interface Props {
  /** índice do ponto atual da rota (modo demonstração). undefined = posição ao vivo sem esquema */
  step?: number;
  ativo: boolean;
  endereco: string;
  velocidade: number;
  pins: MapPin[];
}

/** Mapa esquemático (sem tiles): vias, paradas e a van deslizando entre os pontos. */
export const RouteMap: React.FC<Props> = ({ step, ativo, endereco, velocidade, pins }) => {
  const [w, setW] = useState(0);
  const vx = useRef(new Animated.Value(0)).current;
  const vy = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);
  const idx = Math.min(Math.max(step ?? 2, 0), PATH.length - 1);

  useEffect(() => {
    if (!w) return;
    const x = PATH[idx].x * w;
    const y = PATH[idx].y;
    if (!placed.current) { vx.setValue(x); vy.setValue(y); placed.current = true; return; }
    Animated.parallel([
      Animated.spring(vx, { toValue: x, useNativeDriver: true, ...motion.spring.gentle }),
      Animated.spring(vy, { toValue: y, useNativeDriver: true, ...motion.spring.gentle }),
    ]).start();
  }, [idx, w, vx, vy]);

  useEffect(() => {
    const l = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    l.start();
    return () => l.stop();
  }, [pulse]);

  const dots: { x: number; y: number }[] = [];
  const pts = [...PATH, DESTINO];
  for (let i = 0; i < pts.length - 1; i++) {
    for (let k = 1; k < 6; k++) {
      dots.push({ x: (pts[i].x + ((pts[i + 1].x - pts[i].x) * k) / 6) * w, y: pts[i].y + ((pts[i + 1].y - pts[i].y) * k) / 6 });
    }
  }

  return (
    <View style={s.canvas} onLayout={(e) => setW(e.nativeEvent.layout.width)} accessibilityLabel={`Mapa da rota. Van em ${endereco}`}>
      {/* quarteirões e vias */}
      <View style={[s.block, { left: 14, top: 14, width: 96, height: 60 }]} />
      <View style={[s.block, { right: 18, top: 24, width: 120, height: 70 }]} />
      <View style={[s.block, { left: 40, bottom: 18, width: 130, height: 54 }]} />
      <View style={[s.street, { top: 100, left: 0, right: 0, height: 16 }]} />
      <View style={[s.street, { top: 0, bottom: 0, left: '36%', width: 16 }]} />
      <View style={[s.street, { top: 0, bottom: 0, right: '18%', width: 14 }]} />

      {/* trajeto tracejado */}
      {w > 0 && dots.map((d, i) => (
        <View key={i} style={[s.dot, { left: d.x - 2, top: d.y - 2 }]} />
      ))}

      {/* paradas */}
      {w > 0 && pins.slice(0, PATH.length).map((p, i) => {
        const pt = PATH[i];
        const done = p.status === 'EMBARCADO' || p.status === 'DESEMBARCADO';
        const ausente = p.status === 'AUSENTE';
        return (
          <View key={p.nome + i} style={[s.pinWrap, { left: pt.x * w - 15, top: pt.y - 40 }]}>
            <View style={[s.pin, done && { backgroundColor: colors.systemGreen }, ausente && { backgroundColor: colors.systemGray }]}>
              <Ionicons name={done ? 'checkmark' : ausente ? 'close' : 'home'} size={13} color="#fff" />
            </View>
            <Text style={s.pinLabel} numberOfLines={1}>{p.nome.split(' ')[0]}</Text>
          </View>
        );
      })}

      <View style={[s.pinWrap, { left: DESTINO.x * w - 15, top: DESTINO.y - 38 }]}>
        <View style={[s.pin, { backgroundColor: colors.ink }]}><Ionicons name="school" size={13} color="#fff" /></View>
      </View>

      {/* van */}
      {w > 0 && (
        <Animated.View style={[s.van, { transform: [{ translateX: Animated.add(vx, new Animated.Value(-22)) }, { translateY: Animated.add(vy, new Animated.Value(-22)) }] }]}>
          <Animated.View style={[s.radar, {
            opacity: ativo ? pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }) : 0,
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.7] }) }],
          }]} />
          <View style={[s.vanBubble, !ativo && { borderColor: colors.borderOpaque }]}>
            <Ionicons name="bus" size={18} color={ativo ? colors.accentDark : colors.textTertiary} />
          </View>
        </Animated.View>
      )}

      {/* sobreposições */}
      <View style={s.address}>
        <View style={[s.liveDot, !ativo && { backgroundColor: colors.systemGray }]} />
        <Text style={s.addressText} numberOfLines={1}>{endereco}</Text>
        {ativo && velocidade > 0 ? <Text style={s.speed}>{velocidade} km/h</Text> : null}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  canvas: { height: HEIGHT, backgroundColor: '#E6ECF2', borderRadius: radius.lg, borderCurve: 'continuous', overflow: 'hidden' },
  block: { position: 'absolute', backgroundColor: '#DCE5ED', borderRadius: 14 },
  street: { position: 'absolute', backgroundColor: '#FFFFFF' },
  dot: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent },
  pinWrap: { position: 'absolute', width: 30, alignItems: 'center' },
  pin: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accent, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  pinLabel: { ...type.caption, fontSize: 10, color: colors.textPrimary, marginTop: 2, backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 4, borderRadius: 4, overflow: 'hidden', width: 48, textAlign: 'center' },
  van: { position: 'absolute', left: 0, top: 0, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  radar: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(245,158,11,0.35)' },
  vanBubble: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 8px rgba(0,0,0,0.18)' },
  address: {
    position: 'absolute', left: 10, right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.glass, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 10,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.systemGreen },
  addressText: { flex: 1, ...type.footnote, fontWeight: '600', color: colors.textPrimary },
  speed: { ...type.footnote, fontWeight: '700', color: colors.textSecondary },
});
