import { ApiError, createApiClient, type TokenStore } from './client';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as Response;
}

function memoryStore(): TokenStore & {
  access: string;
  refresh: string;
} {
  const state = {
    access: 'old',
    refresh: 'r1',
    getAccessToken: async () => state.access,
    getRefreshToken: async () => state.refresh,
    saveTokens: async (tokens: { accessToken: string; refreshToken: string }) => {
      state.access = tokens.accessToken;
      state.refresh = tokens.refreshToken;
    },
  };
  return state;
}

test('varios 401 usan un solo refresh', async () => {
  const store = memoryStore();
  let refreshCalls = 0;
  const fetchFn = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/auth/refresh')) {
      refreshCalls += 1;
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 20);
      });
      return jsonResponse(200, {
        accessToken: 'new',
        refreshToken: 'r2',
        expiresIn: 900,
      });
    }
    const authorization = new Headers(init?.headers).get('Authorization');
    if (authorization !== 'Bearer new') {
      return jsonResponse(401, { message: 'Token invalido o expirado' });
    }
    return jsonResponse(200, { locations: [] });
  });

  const client = createApiClient({
    baseUrl: 'https://example.test',
    fetchFn: fetchFn as typeof fetch,
    store,
    onSessionExpired: jest.fn(),
  });

  const results = await Promise.all([
    client.request<{ locations: [] }>('/locations'),
    client.request<{ locations: [] }>('/locations'),
    client.request<{ locations: [] }>('/locations'),
  ]);

  expect(refreshCalls).toBe(1);
  expect(store.refresh).toBe('r2');
  expect(results).toHaveLength(3);
});

test('un refresh inválido cierra la sesión', async () => {
  const onSessionExpired = jest.fn();
  const fetchFn = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/auth/refresh')) {
      return jsonResponse(401, { message: 'Refresh token inválido' });
    }
    return jsonResponse(401, { message: 'Token invalido o expirado' });
  });

  const client = createApiClient({
    baseUrl: 'https://example.test',
    fetchFn: fetchFn as typeof fetch,
    store: memoryStore(),
    onSessionExpired,
  });

  await expect(client.request('/locations')).rejects.toBeInstanceOf(ApiError);
  expect(onSessionExpired).toHaveBeenCalledTimes(1);
});
