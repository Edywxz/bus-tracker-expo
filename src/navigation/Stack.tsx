import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { Animated, BackHandler, Dimensions, PanResponder, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { fill, motion } from '../theme/tokens';

const W = Dimensions.get('window').width;
const PARALLAX = 0.28;

type Route = { key: string; name: string; params?: any; progress: Animated.Value };

interface StackApi {
  push: (name: string, params?: any) => void;
  pop: () => void;
  popToTop: () => void;
}
const StackCtx = createContext<StackApi | null>(null);
const PushedCtx = createContext<boolean>(false);

export const useStack = (): StackApi => {
  const c = useContext(StackCtx);
  if (!c) throw new Error('useStack fora de um StackHost');
  return c;
};
export const useStackOptional = (): StackApi | null => useContext(StackCtx);
/** true quando a tela atual foi empilhada (mostra botão Voltar) */
export const useIsPushed = () => useContext(PushedCtx);

interface Props {
  base: React.ReactNode;
  screens: Record<string, React.ComponentType<{ params?: any }>>;
}

/**
 * Pilha de navegação nativa-like: push desliza da direita com paralaxe na tela de baixo,
 * voltar por gesto na borda esquerda ou pelo botão do sistema (Android).
 */
export const StackHost: React.FC<Props> = ({ base, screens }) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const counter = useRef(0);
  const busy = useRef(false);

  const push = useCallback((name: string, params?: any) => {
    if (busy.current) return;
    busy.current = true;
    const progress = new Animated.Value(0);
    const r: Route = { key: `${name}-${counter.current++}`, name, params, progress };
    setRoutes((prev) => [...prev, r]);
    Animated.timing(progress, { toValue: 1, duration: 360, easing: motion.easing, useNativeDriver: true })
      .start(() => { busy.current = false; });
  }, []);

  const pop = useCallback(() => {
    setRoutes((prev) => {
      const top = prev[prev.length - 1];
      if (!top || busy.current) return prev;
      busy.current = true;
      Animated.timing(top.progress, { toValue: 0, duration: 280, easing: motion.easing, useNativeDriver: true })
        .start(() => {
          busy.current = false;
          setRoutes((p) => p.filter((x) => x.key !== top.key));
        });
      return prev;
    });
  }, []);

  const popToTop = useCallback(() => setRoutes([]), []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (routes.length > 0) { pop(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [routes.length, pop]);

  const api = useMemo(() => ({ push, pop, popToTop }), [push, pop, popToTop]);
  const top = routes[routes.length - 1];

  // Gesto de voltar pela borda esquerda
  const edge = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, g) => {
          if (top && !busy.current) top.progress.setValue(Math.max(0, 1 - g.dx / W));
        },
        onPanResponderRelease: (_, g) => {
          if (!top) return;
          if (g.dx > W * 0.33 || g.vx > 0.6) {
            busy.current = true;
            Animated.timing(top.progress, { toValue: 0, duration: 200, easing: motion.easing, useNativeDriver: true })
              .start(() => { busy.current = false; setRoutes((p) => p.filter((x) => x.key !== top.key)); });
          } else {
            Animated.spring(top.progress, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 3 }).start();
          }
        },
        onPanResponderTerminate: () => {
          if (top) Animated.spring(top.progress, { toValue: 1, useNativeDriver: true }).start();
        },
      }),
    [top]
  );

  const layerStyle = (nextProgress?: Animated.Value) =>
    nextProgress
      ? {
          transform: [{ translateX: nextProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -W * PARALLAX] }) }],
        }
      : undefined;

  return (
    <StackCtx.Provider value={api}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, layerStyle(routes[0]?.progress)]}>{base}</Animated.View>
        {routes.map((r, i) => {
          const Screen = screens[r.name];
          const next = routes[i + 1]?.progress;
          return (
            <React.Fragment key={r.key}>
              {/* escurece a camada de baixo */}
              <Animated.View
                pointerEvents="none"
                style={[styles.dim, { opacity: r.progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] }) }]}
              />
              <Animated.View
                style={[
                  styles.card,
                  {
                    transform: [
                      { translateX: Animated.add(r.progress.interpolate({ inputRange: [0, 1], outputRange: [W, 0] }),
                          next ? next.interpolate({ inputRange: [0, 1], outputRange: [0, -W * PARALLAX] }) : new Animated.Value(0)) },
                    ],
                  },
                ]}
              >
                <PushedCtx.Provider value>
                  <Screen params={r.params} />
                </PushedCtx.Provider>
                {i === routes.length - 1 && <View style={styles.edge} {...edge.panHandlers} />}
              </Animated.View>
            </React.Fragment>
          );
        })}
      </View>
    </StackCtx.Provider>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  card: {
    ...fill,
    backgroundColor: colors.background,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: -4, height: 0 },
  },
  dim: { ...fill, backgroundColor: '#000' },
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 22 },
});
