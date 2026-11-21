const configured = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_URL = (configured && configured.length > 0 ? configured : "http://127.0.0.1:8000").replace(
  /\/$/,
  "",
);
