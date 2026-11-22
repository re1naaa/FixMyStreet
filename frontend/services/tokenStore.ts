import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "fixmystreet.session";
const ACCOUNT_KEY = "fixmystreet.account";

const memory = new Map<string, string>();

function webStorage(): Storage | null {
  try {
    return typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

async function readValue(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return webStorage()?.getItem(key) ?? memory.get(key) ?? null;
  }
  return memory.get(key) ?? SecureStore.getItemAsync(key);
}

async function writeValue(key: string, value: string, persist: boolean): Promise<void> {
  memory.set(key, value);
  if (!persist) {
    if (Platform.OS === "web") {
      try { webStorage()?.removeItem(key); } catch {}
    } else {
      await SecureStore.deleteItemAsync(key);
    }
    return;
  }
  if (Platform.OS === "web") {
    try { webStorage()?.setItem(key, value); } catch {}
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeValue(key: string): Promise<void> {
  memory.delete(key);
  if (Platform.OS === "web") {
    try { webStorage()?.removeItem(key); } catch {}
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function readToken(): Promise<string | null> {
  return readValue(TOKEN_KEY);
}

export async function saveToken(token: string, persist = true): Promise<void> {
  await writeValue(TOKEN_KEY, token, persist);
}

export async function clearToken(): Promise<void> {
  await removeValue(TOKEN_KEY);
}

export async function readRememberedEmail(): Promise<string | null> {
  return readValue(ACCOUNT_KEY);
}

export async function saveRememberedEmail(email: string): Promise<void> {
  await writeValue(ACCOUNT_KEY, email.trim().toLowerCase(), true);
}

export async function clearRememberedEmail(): Promise<void> {
  await removeValue(ACCOUNT_KEY);
}
