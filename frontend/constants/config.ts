import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = 8000;
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "10.0.2.2"];

function hostOf(url: string): string {
  return url.replace(/^\w+:\/\//, "").split(/[/:]/)[0] ?? "";
}

// The Expo dev server host (e.g. "192.168.1.20:8081") is the computer running the
// backend, so a phone on the same Wi-Fi can reach the API through that address.
function devServerHost(): string | null {
  if (Platform.OS === "web") {
    return typeof window !== "undefined" ? window.location.hostname : null;
  }
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost ??
    null;
  return hostUri ? hostOf(hostUri) : null;
}

function resolveApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  const devHost = devServerHost();
  const devHostIsRemote = !!devHost && !LOCAL_HOSTS.includes(devHost);

  if (configured) {
    // A localhost API URL only works on the computer itself; on a phone, swap in the dev server host.
    if (LOCAL_HOSTS.includes(hostOf(configured)) && devHostIsRemote) {
      return configured.replace(hostOf(configured), devHost);
    }
    return configured;
  }
  if (devHostIsRemote) return `http://${devHost}:${API_PORT}`;
  return Platform.OS === "android" ? `http://10.0.2.2:${API_PORT}` : `http://127.0.0.1:${API_PORT}`;
}

export const API_URL = resolveApiUrl();
