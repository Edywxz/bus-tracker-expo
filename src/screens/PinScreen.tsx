import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fill, layout, radius, spacing } from '../theme/tokens';
import { type } from '../theme/type';
import { Button, GlassSurface, Notice } from '../components/ui/kit';
import { useApp } from '../context/AppContext';
import { mensagemErro } from '../utils/format';

const BRASIL = { latitude: -15.0, longitude: -52.0, latitudeDelta: 30, longitudeDelta: 30 };

/** Confirmar/ajustar o ponto no mapa. O pino confirmado pelo responsável vira a verdade e não é mais sobrescrito. */
export const PinScreen: React.FC<{ alunoId?: string; tipo?: string }> = ({ alunoId, tipo }) => {
  const { alunos, ajustarPino, geocodificarEndereco, isDemo } = useApp();
  const insets = useSafeAreaInsets();
  const a = alunos.find((x) => x.id === alunoId);
  const entrega = tipo === 'entrega';
  const texto = entrega ? a?.endereco_entrega : a?.endereco_busca;
  const lat = entrega ? a?.entrega_latitude : a?.latitude;
  const lng = entrega ? a?.entrega_longitude : a?.longitude;
  const [pos, setPos] = useState(lat != null && lng != null ? { latitude: lat, longitude: lng } : null);
  const mapa = useRef<MapView>(null);
  const [busy, setBusy] = useState<'salvar' | 'buscar' | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Depois de "Localizar pelo endereço" as coordenadas chegam pelo app: leva o pino e a câmera até lá.
  useEffect(() => {
    if (lat == null || lng == null) return;
    setPos({ latitude: lat, longitude: lng });
    mapa.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.006, longitudeDelta: 0.006 }, 400);
  }, [lat, lng]);

  if (!a) return <View style={fill} />;

  const salvar = async () => {
    if (!pos) return;
    setBusy('salvar'); setErro(null);
    try { await ajustarPino(a.id, entrega ? 'entrega' : 'busca', pos.latitude, pos.longitude); router.back(); }
    catch (e) { setErro(mensagemErro(e)); } finally { setBusy(null); }
  };
  const buscar = async () => {
    setBusy('buscar'); setErro(null); setAviso(null);
    try {
      const r = await geocodificarEndereco(a.id, entrega ? 'entrega' : 'busca');
      setAviso(r.ok ? 'Localizamos o endereço. Confira o ponto e ajuste se precisar.' : r.mensagem ?? 'Não encontramos esse endereço. Toque no mapa para marcar.');
    } catch (e) { setErro(mensagemErro(e)); } finally { setBusy(null); }
  };

  return (
    <View style={fill}>
      <Stack.Screen options={{ title: 'Confirmar localização' }} />
      <MapView
        ref={mapa}
        style={fill}
        userInterfaceStyle="light"
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsPointsOfInterests={false}
        initialRegion={pos ? { ...pos, latitudeDelta: 0.006, longitudeDelta: 0.006 } : BRASIL}
        onPress={(e) => setPos(e.nativeEvent.coordinate)}
      >
        {pos ? <Marker coordinate={pos} draggable onDragEnd={(e) => setPos(e.nativeEvent.coordinate)} pinColor={colors.primary as string} /> : null}
      </MapView>

      <View style={[s.painel, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <GlassSurface material="chrome" floating style={s.card}>
          <Text style={s.titulo}>{entrega ? 'Onde desembarca' : 'Onde embarca'}</Text>
          <Text style={s.endereco} selectable>{texto}</Text>
          <Text style={s.dica}>{pos ? 'Arraste o pino ou toque no mapa para corrigir.' : 'Toque no mapa para marcar o ponto exato.'}</Text>
          {aviso ? <Notice tone="info" message={aviso} /> : null}
          {erro ? <Notice tone="error" message={erro} /> : null}
          <View style={s.acoes}>
            {!isDemo ? <Button style={{ flex: 1 }} variant="tinted" label="Localizar pelo endereço" onPress={buscar} loading={busy === 'buscar'} disabled={!!busy} /> : null}
            <Button style={{ flex: 1 }} label="Confirmar ponto" onPress={salvar} loading={busy === 'salvar'} disabled={!pos || !!busy} />
          </View>
        </GlassSurface>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  painel: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: layout.gutter },
  card: { padding: spacing.lg, gap: spacing.sm, borderRadius: radius.xl },
  titulo: { ...type.footnote, color: colors.secondaryLabel },
  endereco: { ...type.headline, color: colors.label },
  dica: { ...type.footnote, color: colors.secondaryLabel },
  acoes: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
