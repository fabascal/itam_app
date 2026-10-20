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

test('FormData no fuerza Content-Type', async () => {
  const fetchFn = jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    expect(headers.get('Content-Type')).toBeNull();
    expect(init?.body).toBeInstanceOf(FormData);
    return jsonResponse(200, {});
  });
  const client = createApiClient({
    baseUrl: 'https://example.test',
    fetchFn: fetchFn as typeof fetch,
    store: memoryStore(),
    onSessionExpired: jest.fn(),
  });
  const form = new FormData();
  form.append('file', 'foto');
  await client.request('/upload', { method: 'POST', body: form });
});

test('withAuth reintenta tras un refresh', async () => {
  let refreshCalls = 0;
  const fetchFn = jest.fn(async (input: RequestInfo | URL) => {
    if (String(input).endsWith('/auth/refresh')) {
      refreshCalls += 1;
      return jsonResponse(200, { accessToken: 'new', refreshToken: 'r2' });
    }
    return jsonResponse(200, {});
  });
  const client = createApiClient({
    baseUrl: 'https://example.test',
    fetchFn: fetchFn as typeof fetch,
    store: memoryStore(),
    onSessionExpired: jest.fn(),
  });
  let attempts = 0;
  const result = await client.withAuth(async () => {
    attempts += 1;
    if (attempts === 1) {
      throw new ApiError(401, 'Token invalido o expirado');
    }
    return 'ok';
  });
  expect(result).toBe('ok');
  expect(attempts).toBe(2);
  expect(refreshCalls).toBe(1);
});
