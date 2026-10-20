import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { API_BASE, ApiError, createApiClient, type TokenStore } from '../api/client';
import { createMobileApi, type MobileApi } from '../api/mobile';
import type { User } from '../api/types';
import { clearSession, readSession, writeSession, type StoredSession } from './storage';

type Status = 'signedOut' | 'signedIn' | 'denied';

type SessionContextValue = {
  ready: boolean;
  status: Status;
  notice: string | null;
  user: User | null;
  accessToken: string | null;
  canWrite: boolean;
  api: MobileApi;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deny: () => void;
  refreshMe: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const sessionRef = useRef<StoredSession | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<Status>('signedOut');
  const [notice, setNotice] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const store = useMemo<TokenStore>(
    () => ({
      getAccessToken: async () => sessionRef.current?.accessToken ?? null,
      getRefreshToken: async () => sessionRef.current?.refreshToken ?? null,
      saveTokens: async tokens => {
        if (!sessionRef.current) {
          throw new Error('No hay sesión');
        }
        const next = { ...sessionRef.current, ...tokens };
        sessionRef.current = next;
        setAccessToken(tokens.accessToken);
        await writeSession(next);
      },
    }),
    [],
  );

  const expire = useCallback(() => {
    sessionRef.current = null;
    setUser(null);
    setPermissions([]);
    setAccessToken(null);
    clearSession().catch(() => undefined);
    setNotice('Tu sesión expiró. Inicia sesión de nuevo.');
    setStatus('signedOut');
  }, []);

  const client = useMemo(
    () =>
      createApiClient({
        baseUrl: API_BASE,
        store,
        onSessionExpired: expire,
      }),
    [expire, store],
  );

  const api = useMemo(() => createMobileApi(client), [client]);

  useEffect(() => {
    let active = true;
    readSession()
      .then(stored => {
        if (!active) {
          return;
        }
        sessionRef.current = stored;
        setUser(stored?.user ?? null);
        setPermissions(stored?.permissions ?? []);
        setAccessToken(stored?.accessToken ?? null);
        if (!stored) {
          setStatus('signedOut');
        } else if (!stored.permissions.includes('assets.read')) {
          setStatus('denied');
        } else {
          setStatus('signedIn');
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }
        sessionRef.current = null;
        setUser(null);
        setPermissions([]);
        setAccessToken(null);
        setStatus('signedOut');
      })
      .finally(() => {
        if (active) {
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await api.login(email, password);
      const stored: StoredSession = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
        permissions: result.permissions,
      };
      sessionRef.current = stored;
      setUser(stored.user);
      setPermissions(stored.permissions);
      setAccessToken(stored.accessToken);
      await writeSession(stored);
      setNotice(null);
      setStatus(
        stored.permissions.includes('assets.read') ? 'signedIn' : 'denied',
      );
    },
    [api],
  );

  const signOut = useCallback(async () => {
    const refreshToken = sessionRef.current?.refreshToken;
    sessionRef.current = null;
    setUser(null);
    setPermissions([]);
    setAccessToken(null);
    setNotice(null);
    setStatus('signedOut');
    try {
      await clearSession();
    } catch {
      // La sesión local ya no se usa.
    }
    if (!refreshToken) {
      return;
    }
    try {
      await api.logout(refreshToken);
    } catch {
      // Los tokens locales ya se borraron.
    }
  }, [api]);

  const deny = useCallback(() => {
    setStatus('denied');
  }, []);

  const refreshMe = useCallback(async () => {
    if (!sessionRef.current) {
      return;
    }
    const result = await api.me();
    if (!sessionRef.current) {
      return;
    }
    const next = {
      ...sessionRef.current,
      user: result.user,
      permissions: result.permissions,
    };
    sessionRef.current = next;
    setUser(result.user);
    setPermissions(result.permissions);
    await writeSession(next);
    if (!result.permissions.includes('assets.read')) {
      setStatus('denied');
    }
  }, [api]);

  useEffect(() => {
    if (!ready || status !== 'signedIn') {
      return;
    }
    refreshMe().catch(() => undefined);
  }, [ready, refreshMe, status]);

  const value = useMemo(
    () => ({
      ready,
      status,
      notice,
      user,
      accessToken,
      canWrite: permissions.includes('assets.write'),
      api,
      signIn,
      signOut,
      deny,
      refreshMe,
    }),
    [
      accessToken,
      api,
      deny,
      notice,
      permissions,
      ready,
      refreshMe,
      signIn,
      signOut,
      status,
      user,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession fuera de SessionProvider');
  }
  return value;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
