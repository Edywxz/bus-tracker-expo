import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Icon, StopMarker } from './ds';
import { colors } from '../theme/colors';
import { fill, radius } from '../theme/tokens';
import { type } from '../theme/type';
import type { Ponto } from '../utils/proximidade';

/**
 * Mapa real (Apple Maps no iOS, Google Maps no Android) com a van ao vivo, as paradas dos passageiros
 * e o destaque de quem chega primeiro. Mesma linguagem visual do mapa esquemático: a van é a única forma amarela.
 */
export interface MapaParada {
  id: string; nome: string; latitude: number; longitude: number;
  status: 'AGUARDANDO' | 'EMBARCADO' | 'DESEMBARCADO' | 'AUSENTE';
  /** chega primeiro entre os dependentes a bordo */
  destaque?: boolean;
  /** a casa/dependente do usuário (marcador de casa) */
  casa?: boolean;
}

interface Props {
  van?: Ponto | null;
  vanAtiva: boolean;
  trilha?: Ponto[];
  paradas: MapaParada[];
  /** espaço ocupado pela sheet flutuante embaixo, para o enquadramento */
  paddingBottom?: number;
  accessibilityLabel: string;
}

/** Marcador com conteúdo de View: rastreia mudanças só por um instante, depois congela (evita custo e piscadas). */
const Pin: React.FC<{ coordinate: Ponto; rev: string; zIndex?: number; children: React.ReactNode }> = ({ coordinate, rev, zIndex, children }) => {
  const [track, setTrack] = useState(true);
  useEffect(() => {
    setTrack(true);
    const t = setTimeout(() => setTrack(false), 700);
    return () => clearTimeout(t);
  }, [rev]);
  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={track} zIndex={zIndex}>
      {children}
    </Marker>
  );
};

export const LiveMap: React.FC<Props> = ({ van, vanAtiva, trilha, paradas, paddingBottom = 340, accessibilityLabel }) => {
  const ref = useRef<MapView>(null);
  const [pronto, setPronto] = useState(false);
  const assinatura = paradas.map((p) => `${p.id}:${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`).join('|');
  const temVan = !!van;

  // Reenquadra quando muda o conjunto de paradas ou quando a van aparece; não a cada ponto de GPS.
  useEffect(() => {
    if (!pronto) return;
    const pts: Ponto[] = [...paradas.map((p) => ({ latitude: p.latitude, longitude: p.longitude })), ...(van ? [van] : [])];
    if (pts.length === 0) return;
    if (pts.length === 1) {
      ref.current?.animateToRegion({ ...pts[0], latitudeDelta: 0.012, longitudeDelta: 0.012 }, 400);
      return;
    }
    ref.current?.fitToCoordinates(pts, { edgePadding: { top: 130, right: 60, bottom: paddingBottom, left: 60 }, animated: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, assinatura, temVan, paddingBottom]);

  return (
    <View style={fill} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <MapView
        ref={ref}
        style={fill}
        onMapReady={() => setPronto(true)}
        userInterfaceStyle="light"
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsPointsOfInterests={false}
        showsCompass={false}
        initialRegion={{ latitude: -23.5505, longitude: -46.6333, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
      >
        {trilha && trilha.length > 1 ? <Polyline coordinates={trilha} strokeColor={colors.route} strokeWidth={5} lineCap="round" lineJoin="round" /> : null}

        {paradas.map((p) => {
          const feito = p.status === 'EMBARCADO' || p.status === 'DESEMBARCADO' || p.status === 'AUSENTE';
          const grande = p.casa || p.destaque;
          return (
            <Pin key={p.id} coordinate={p} rev={`${p.status}${p.casa}${p.destaque}`} zIndex={p.destaque ? 3 : 1}>
              <View style={s.pin}>
                <StopMarker kind={grande ? 'home' : 'stop'} done={feito} label={p.nome} />
                <Text style={[s.rotulo, p.destaque && s.rotuloDestaque]} numberOfLines={1}>
                  {p.destaque ? `${p.nome.split(' ')[0]} · chega primeiro` : p.nome.split(' ')[0]}
                </Text>
              </View>
            </Pin>
          );
        })}

        {van ? (
          <Pin coordinate={van} rev={`${vanAtiva}`} zIndex={5}>
            <View style={[s.van, !vanAtiva && { backgroundColor: colors.fill1 }]}>
              <Icon name="van" size={20} color={vanAtiva ? colors.onSignal : colors.label} />
            </View>
          </Pin>
        ) : null}
      </MapView>
    </View>
  );
};

const s = StyleSheet.create({
  pin: { alignItems: 'center', gap: 2, minWidth: 80, paddingVertical: 4 },
  rotulo: { ...type.caption2, color: colors.label, backgroundColor: colors.matThick, paddingHorizontal: 4, borderRadius: radius.xs, overflow: 'hidden', maxWidth: 140, textAlign: 'center' },
  rotuloDestaque: { backgroundColor: colors.primary, color: colors.onPrimary },
  van: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.systemBg },
});
