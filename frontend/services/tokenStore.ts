import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "fixmystreet.session";

const memory = new Map<string, string>();

function webStorage(): Storage | null {
  try {
    return typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

export async function readToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return webStorage()?.getItem(TOKEN_KEY) ?? memory.get(TOKEN_KEY) ?? null;
  }
  return memory.get(TOKEN_KEY) ?? SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveToken(token: string, persist = true): Promise<void> {
  memory.set(TOKEN_KEY, token);
  if (!persist) {
    if (Platform.OS === "web") {
      try { webStorage()?.removeItem(TOKEN_KEY); } catch {}
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    return;
  }
  if (Platform.OS === "web") {
    try { webStorage()?.setItem(TOKEN_KEY, token); } catch {}
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  memory.delete(TOKEN_KEY);
  if (Platform.OS === "web") {
    try { webStorage()?.removeItem(TOKEN_KEY); } catch {}
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
