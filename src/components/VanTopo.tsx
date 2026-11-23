import React from 'react';
import Svg, { Defs, Ellipse, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';

/** Van escolar vista de cima, apontando para cima (o mapa a gira). O gradiente e a sombra dão volume. */
export const VanTopo: React.FC<{ ativa: boolean; size?: number }> = ({ ativa, size = 34 }) => {
  const corpo = ativa ? colors.signal : '#B8B8BE';
  return (
    <Svg width={size * 0.625} height={size} viewBox="0 0 40 64">
      <Defs>
        <LinearGradient id="teto" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#000" stopOpacity="0.18" />
          <Stop offset="0.5" stopColor="#fff" stopOpacity="0.25" />
          <Stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="20" cy="36" rx="19" ry="29" fill="#000" opacity={0.18} />
      <Rect x="2" y="21" width="5" height="7" rx="2" fill={corpo} />
      <Rect x="33" y="21" width="5" height="7" rx="2" fill={corpo} />
      <Rect x="5" y="2" width="30" height="58" rx="9" fill={corpo} stroke="#00000040" strokeWidth="1" />
      <Rect x="5" y="2" width="30" height="58" rx="9" fill="url(#teto)" />
      <Rect x="9" y="9" width="22" height="11" rx="4" fill="#1F2937" />
      <Rect x="9" y="50" width="22" height="6" rx="3" fill="#1F2937" />
      <Rect x="10" y="26" width="20" height="19" rx="4" fill="#fff" opacity={0.28} />
    </Svg>
  );
};
