export const SITE_URL_PADRAO = 'https://edywxz.github.io/bus-tracker-expo/';

/** Endereço de uma página do site. Pura: quem chama passa `process.env.EXPO_PUBLIC_SITE_URL` (o Expo só embute a leitura literal). */
export function urlDoSite(caminho: string, base?: string): string {
  return (base || SITE_URL_PADRAO).replace(/\/+$/, '') + '/' + caminho.replace(/^\/+/, '');
}
