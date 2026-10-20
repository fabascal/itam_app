import type { ApiClient } from './client';
import type {
  Asset,
  AssetSummary,
  Location,
  LoginResponse,
} from './types';

export function createMobileApi(client: ApiClient) {
  return {
    login(email: string, password: string) {
      return client.request<LoginResponse>(
        '/auth/login',
        { method: 'POST', auth: false, body: { email, password } },
        false,
      );
    },
    logout(refreshToken: string) {
      return client.request<{ message: string }>(
        '/auth/logout',
        { method: 'POST', auth: false, body: { refreshToken } },
        false,
      );
    },
    locations() {
      return client.request<{ locations: Location[] }>('/locations');
    },
    assets(locationId: number, includeChildren: boolean) {
      const query = includeChildren ? '?includeChildren=true' : '';
      return client.request<{
        location: { id: number; name: string; path: string };
        assets: AssetSummary[];
      }>(`/locations/${locationId}/assets${query}`);
    },
    asset(id: number) {
      return client.request<{ asset: Asset }>(`/assets/${id}`);
    },
  };
}

export type MobileApi = ReturnType<typeof createMobileApi>;
