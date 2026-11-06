/** Distância e escolha do "primeiro a chegar" entre os dependentes de um responsável. */
export interface Ponto { latitude: number; longitude: number }

interface ComPonto {
  statusEmbarque: string;
  latitude?: number | null; longitude?: number | null;
  entrega_latitude?: number | null; entrega_longitude?: number | null;
}

const rad = (g: number) => (g * Math.PI) / 180;

/** Distância em km entre dois pontos (haversine). */
export const distanciaKm = (a: Ponto, b: Ponto) => {
  const dLat = rad(b.latitude - a.latitude), dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

/** Onde o dependente desce na viagem atual: ida → entrega (ou casa, se faltar); volta → casa. */
export const pontoDeDescida = (a: ComPonto, tipo: 'IDA' | 'VOLTA'): Ponto | null => {
  const casa = a.latitude != null && a.longitude != null ? { latitude: a.latitude, longitude: a.longitude } : null;
  const entrega = a.entrega_latitude != null && a.entrega_longitude != null
    ? { latitude: a.entrega_latitude, longitude: a.entrega_longitude } : null;
  return tipo === 'VOLTA' ? casa : entrega ?? casa;
};

/**
 * Entre os dependentes que estão a bordo, o que chega primeiro: o de endereço mais próximo da van.
 * Ignora quem não tem coordenadas (devolve null se nenhum tiver).
 */
export function primeiroAChegar<T extends ComPonto>(van: Ponto, dependentes: T[], tipo: 'IDA' | 'VOLTA'): { aluno: T; km: number } | null {
  let melhor: { aluno: T; km: number } | null = null;
  for (const a of dependentes) {
    if (a.statusEmbarque !== 'EMBARCADO') continue;
    const p = pontoDeDescida(a, tipo);
    if (!p) continue;
    const km = distanciaKm(van, p);
    if (!melhor || km < melhor.km) melhor = { aluno: a, km };
  }
  return melhor;
}
