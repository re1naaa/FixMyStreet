const appJson = require("./app.json");

module.exports = ({ config }) => {
  const expo = config || appJson.expo;
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  return {
    ...expo,
    android: {
      ...(expo.android || {}),
      config: {
        ...(expo.android?.config || {}),
        googleMaps: googleMapsApiKey ? { apiKey: googleMapsApiKey } : undefined,
      },
    },
    ios: {
      ...(expo.ios || {}),
      config: {
        ...(expo.ios?.config || {}),
        googleMapsApiKey: googleMapsApiKey || undefined,
      },
    },
  };
};
