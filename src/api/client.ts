export const API_BASE = 'https://activo.combuexpress.com.mx/api/mobile';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type TokenStore = {
  getAccessToken: () => Promise<string | null>;
  getRefreshToken: () => Promise<string | null>;
  saveTokens: (tokens: {
    accessToken: string;
    refreshToken: string;
  }) => Promise<void>;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

type ClientOptions = {
  baseUrl: string;
  fetchFn?: typeof fetch;
  store: TokenStore;
  onSessionExpired: () => void;
};

async function readMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) {
    return 'Error interno del servidor';
  }
  try {
    const data = JSON.parse(text) as { message?: unknown };
    return typeof data.message === 'string'
      ? data.message
      : 'Error interno del servidor';
  } catch {
    return 'Error interno del servidor';
  }
}

export function createApiClient(options: ClientOptions) {
  const fetchFn = options.fetchFn ?? fetch;
  let refreshInFlight: Promise<boolean> | null = null;

  async function performRefresh(): Promise<boolean> {
    const refreshToken = await options.store.getRefreshToken();
    if (!refreshToken) {
      return false;
    }
    let response: Response;
    try {
      response = await fetchFn(`${options.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      return false;
    }
    if (!response.ok) {
      return false;
    }
    const text = await response.text();
    const body = JSON.parse(text) as {
      accessToken?: string;
      refreshToken?: string;
    };
    if (!body.accessToken || !body.refreshToken) {
      return false;
    }
    try {
      await options.store.saveTokens({
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
      });
    } catch {
      return false;
    }
    return true;
  }

  function refresh(): Promise<boolean> {
    if (!refreshInFlight) {
      refreshInFlight = performRefresh().finally(() => {
        refreshInFlight = null;
      });
    }
    return refreshInFlight;
  }

  async function request<T>(
    path: string,
    init: RequestOptions = {},
    allowRefresh = true,
  ): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (init.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (init.auth !== false) {
      const token = await options.store.getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    let response: Response;
    try {
      response = await fetchFn(`${options.baseUrl}${path}`, {
        method: init.method ?? 'GET',
        headers,
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      });
    } catch {
      throw new ApiError(0, 'No hay conexión.');
    }

    if (response.status === 401 && init.auth !== false && allowRefresh) {
      const renewed = await refresh();
      if (!renewed) {
        options.onSessionExpired();
        throw new ApiError(401, 'Tu sesión expiró. Inicia sesión de nuevo.');
      }
      return request<T>(path, init, false);
    }

    if (!response.ok) {
      throw new ApiError(response.status, await readMessage(response));
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    return JSON.parse(text) as T;
  }

  return { request };
}

export type ApiClient = ReturnType<typeof createApiClient>;
