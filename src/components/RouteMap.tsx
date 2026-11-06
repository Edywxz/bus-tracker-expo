import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { StopMarker, VanMarker } from './ds';
import { colors } from '../theme/colors';
import { fill, motion, radius } from '../theme/tokens';
import { type } from '../theme/type';

/**
 * Mapa esquemático em tela cheia (sem tiles): quadras, vias, rota e marcadores do design system.
 * Rota feita em cinza, restante em tinta; a van é a única forma amarela.
 * A área útil fica entre os botões de vidro do topo e a sheet flutuante da base (≈ 12%–58% da altura).
 */

// Pontos da rota em frações da tela (paradas dos alunos 0..4) e destino (escola).
const PATH = [
  { x: 0.18, y: 0.58 }, { x: 0.18, y: 0.45 }, { x: 0.5, y: 0.45 }, { x: 0.5, y: 0.31 }, { x: 0.82, y: 0.31 },
];
const DESTINO = { x: 0.82, y: 0.17 };
const ROADS_H = [0.17, 0.31, 0.45, 0.58, 0.72];
const ROADS_V = [0.18, 0.5, 0.82];
const MINOR_H = [0.24, 0.38, 0.52];
const MINOR_V = [0.34, 0.66];

export interface MapPin { nome: string; status: 'AGUARDANDO' | 'EMBARCADO' | 'DESEMBARCADO' | 'AUSENTE' }

interface Props {
  /** índice do ponto atual da rota (rota conhecida). Sem ele, a van fica no meio do trajeto. */
  step?: number;
  ativo: boolean;
  pins: MapPin[];
  /** Índice do pin que é a casa do aluno do responsável (marcado com casa). */
  homeIndex?: number;
  accessibilityLabel: string;
}

export const RouteMap: React.FC<Props> = ({ step, ativo, pins, homeIndex, accessibilityLabel }) => {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const vx = useRef(new Animated.Value(0)).current;
  const vy = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);
  const idx = Math.min(Math.max(step ?? 2, 0), PATH.length - 1);
  const { w, h } = size;
  const P = (p: { x: number; y: number }) => ({ x: p.x * w, y: p.y * h });

  useEffect(() => {
    if (!w) return;
    const t = P(PATH[idx]);
    if (!placed.current) { vx.setValue(t.x); vy.setValue(t.y); placed.current = true; return; }
    Animated.parallel([
      Animated.spring(vx, { toValue: t.x, useNativeDriver: true, ...motion.spring.gentle }),
      Animated.spring(vy, { toValue: t.y, useNativeDriver: true, ...motion.spring.gentle }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, w, h]);

  const line = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${P(p).x},${P(p).y}`).join(' ');
  const done = PATH.slice(0, idx + 1);
  const rest = [...PATH.slice(idx), DESTINO];

  return (
    <View style={fill} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      {w > 0 && (
        <Svg width={w} height={h}>
          <Rect x={0} y={0} width={w} height={h} fill={colors.mapLand} />
          <Path d={`M${w * 0.68},0 L${w},0 L${w},${h * 0.2} C${w * 0.86},${h * 0.18} ${w * 0.74},${h * 0.1} ${w * 0.68},0 Z`} fill={colors.mapWater} />
          <Rect x={w * 0.24} y={h * 0.33} width={w * 0.22} height={h * 0.1} rx={18} fill={colors.mapPark} />
          <Rect x={w * 0.56} y={h * 0.47} width={w * 0.22} height={h * 0.09} rx={16} fill={colors.mapPark} />
          {MINOR_H.map((y) => <Path key={`mh${y}`} d={`M0,${y * h} H${w}`} stroke={colors.mapRoad} strokeWidth={6} />)}
          {MINOR_V.map((x) => <Path key={`mv${x}`} d={`M${x * w},0 V${h}`} stroke={colors.mapRoad} strokeWidth={6} />)}
          {ROADS_H.map((y) => <Path key={`eh${y}`} d={`M0,${y * h} H${w}`} stroke={colors.mapRoadEdge} strokeWidth={18} />)}
          {ROADS_V.map((x) => <Path key={`ev${x}`} d={`M${x * w},0 V${h}`} stroke={colors.mapRoadEdge} strokeWidth={18} />)}
          {ROADS_H.map((y) => <Path key={`rh${y}`} d={`M0,${y * h} H${w}`} stroke={colors.mapRoad} strokeWidth={14} />)}
          {ROADS_V.map((x) => <Path key={`rv${x}`} d={`M${x * w},0 V${h}`} stroke={colors.mapRoad} strokeWidth={14} />)}
          <Path d={line(done)} stroke={colors.routeDone} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d={line(rest)} stroke={colors.route} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      )}

      {/* paradas */}
      {w > 0 && pins.slice(0, PATH.length).map((p, i) => {
        const pt = P(PATH[i]);
        const feito = p.status === 'EMBARCADO' || p.status === 'DESEMBARCADO' || p.status === 'AUSENTE';
        const casa = i === homeIndex;
        return (
          <View key={p.nome + i} pointerEvents="none" style={[s.pin, { left: pt.x - 30, top: pt.y - (casa ? 15 : 8) }]}>
            <StopMarker kind={casa ? 'home' : 'stop'} done={feito} label={`${p.nome}${feito ? ', já passou' : ''}`} />
            {i !== idx ? <Text style={s.pinLabel} numberOfLines={1}>{p.nome.split(' ')[0]}</Text> : null}
          </View>
        );
      })}
      {w > 0 && (
        <View pointerEvents="none" style={[s.pin, { left: P(DESTINO).x - 30, top: P(DESTINO).y - 15 }]}>
          <StopMarker kind="school" label="Escola" />
        </View>
      )}

      {/* van */}
      {w > 0 && (
        <Animated.View pointerEvents="none" style={[s.van, { transform: [{ translateX: Animated.add(vx, new Animated.Value(-36)) }, { translateY: Animated.add(vy, new Animated.Value(-36)) }] }]}>
          <VanMarker live={ativo} />
        </Animated.View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  pin: { position: 'absolute', width: 60, alignItems: 'center', gap: 2 },
  pinLabel: { ...type.caption2, color: colors.label, backgroundColor: colors.matThick, paddingHorizontal: 4, borderRadius: radius.xs, overflow: 'hidden', maxWidth: 60, textAlign: 'center' },
  van: { position: 'absolute', left: 0, top: 0 },
});
