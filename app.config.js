// Estende o app.json. A chave do Google Maps (Android) vem do ambiente e nunca é commitada:
//   GOOGLE_MAPS_ANDROID_API_KEY=... npx expo run:android   (ou via EAS secret)
// No Expo Go o mapa funciona sem chave; a chave só é necessária em builds próprios.
module.exports = ({ config }) => {
  const androidKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  return {
    ...config,
    android: {
      ...config.android,
      config: { ...(config.android && config.android.config), ...(androidKey ? { googleMaps: { apiKey: androidKey } } : {}) },
    },
  };
};
