import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getMe, login as loginRequest, register as registerRequest } from "../services/api";
import { clearToken, readToken, saveToken } from "../services/tokenStore";
import type { PublicUser, RegisterInput } from "../types/auth";

type SessionValue = {
  ready: boolean;
  user: PublicUser | null;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: PublicUser) => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await readToken();
        if (!stored) {
          return;
        }
        const me = await getMe(stored);
        if (!active) {
          return;
        }
        setToken(stored);
        setUser(me);
      } catch {
        await clearToken();
        if (!active) {
          return;
        }
        setToken(null);
        setUser(null);
      } finally {
        if (active) {
          setReady(true);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email.trim(), password);
    await saveToken(result.access_token);
    setToken(result.access_token);
    setUser(result.user);
  }, []);

  const signUp = useCallback(async (input: RegisterInput) => {
    const result = await registerRequest({ ...input, email: input.email.trim() });
    await saveToken(result.access_token);
    setToken(result.access_token);
    setUser(result.user);
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ ready, user, token, signIn, signUp, signOut, setUser }),
    [ready, user, token, signIn, signUp, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return value;
}
