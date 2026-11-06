import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { GlassSurface, StopMarker, VanMarker } from './ds';
import { colors } from '../theme/colors';
import { motion, radius, spacing } from '../theme/tokens';
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


  const dots: { x: number; y: number }[] = [];
  const pts = [...PATH, DESTINO];
  for (let i = 0; i < pts.length - 1; i++) {
    for (let k = 1; k < 6; k++) {
      dots.push({ x: (pts[i].x + ((pts[i + 1].x - pts[i].x) * k) / 6) * w, y: pts[i].y + ((pts[i + 1].y - pts[i].y) * k) / 6 });
    }
  }

  return (
    <View style={s.canvas} onLayout={(e) => setW(e.nativeEvent.layout.width)} accessibilityLabel={`Mapa da rota. Van em ${endereco}`}>
      {/* quarteirões, parque e vias (mapa esquemático com tokens de mapa) */}
      <View style={[s.block, { left: 14, top: 14, width: 96, height: 60, backgroundColor: colors.mapPark }]} />
      <View style={[s.block, { right: 18, top: 24, width: 120, height: 70 }]} />
      <View style={[s.block, { left: 40, bottom: 18, width: 130, height: 54 }]} />
      <View style={[s.street, { top: 100, left: 0, right: 0, height: 16 }]} />
      <View style={[s.street, { top: 0, bottom: 0, left: '36%', width: 16 }]} />
      <View style={[s.street, { top: 0, bottom: 0, right: '18%', width: 14 }]} />

      {/* trajeto: feito em cinza, restante em tinta */}
      {w > 0 && dots.map((d, i) => (
        <View key={i} style={[s.dot, { left: d.x - 2, top: d.y - 2, backgroundColor: i < idx * 5 ? colors.routeDone : colors.route }]} />
      ))}

      {/* paradas */}
      {w > 0 && pins.slice(0, PATH.length).map((p, i) => {
        const pt = PATH[i];
        const done = p.status === 'EMBARCADO' || p.status === 'DESEMBARCADO';
        const ausente = p.status === 'AUSENTE';
        return (
          <View key={p.nome + i} style={[s.pinWrap, { left: pt.x * w - 24, top: pt.y - 8 }]}>
            <StopMarker kind="stop" done={done || ausente} label={`${p.nome}${done ? ', embarcou' : ausente ? ', ausente' : ''}`} />
            <Text style={s.pinLabel} numberOfLines={1}>{p.nome.split(' ')[0]}</Text>
          </View>
        );
      })}

      <View style={[s.pinWrap, { left: DESTINO.x * w - 24, top: DESTINO.y - 15 }]}>
        <StopMarker kind="school" label="Escola" />
      </View>

      {/* van — a única forma amarela do mapa */}
      {w > 0 && (
        <Animated.View style={[s.van, { transform: [{ translateX: Animated.add(vx, new Animated.Value(-36)) }, { translateY: Animated.add(vy, new Animated.Value(-36)) }] }]}>
          <VanMarker live={ativo} />
        </Animated.View>
      )}

      {/* endereço atual em vidro */}
      <GlassSurface material="regular" style={s.address}>
        <View style={s.addressRow}>
          <View style={[s.liveDot, !ativo && { backgroundColor: colors.tertiaryLabel }]} />
          <Text style={s.addressText} numberOfLines={1}>{endereco}</Text>
          {ativo && velocidade > 0 ? <Text style={s.speed}>{velocidade} km/h</Text> : null}
        </View>
      </GlassSurface>
    </View>
  );
};

const s = StyleSheet.create({
  canvas: { height: HEIGHT, backgroundColor: colors.mapLand, borderRadius: radius.md, borderCurve: 'continuous', overflow: 'hidden' },
  block: { position: 'absolute', backgroundColor: colors.mapRoadEdge, borderRadius: radius.md, opacity: 0.6 },
  street: { position: 'absolute', backgroundColor: colors.mapRoad },
  dot: { position: 'absolute', width: 4, height: 4, borderRadius: 2 },
  pinWrap: { position: 'absolute', width: 48, alignItems: 'center', gap: 2 },
  pinLabel: { ...type.caption2, color: colors.label, backgroundColor: colors.matThick, paddingHorizontal: 4, borderRadius: 4, overflow: 'hidden', maxWidth: 56, textAlign: 'center' },
  van: { position: 'absolute', left: 0, top: 0 },
  address: { position: 'absolute', left: spacing.sm, right: spacing.sm, bottom: spacing.sm, borderRadius: radius.full },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md + 2, paddingVertical: spacing.sm + 2 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.signal },
  addressText: { flex: 1, ...type.footnote, fontWeight: '600', color: colors.label },
  speed: { ...type.footnote, fontWeight: '600', color: colors.secondaryLabel, fontVariant: ['tabular-nums'] },
});
