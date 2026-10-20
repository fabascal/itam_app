import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { API_BASE, ApiError, type ApiClient } from './client';
import type {
  Asset,
  AssetDocument,
  AssetSummary,
  CountItem,
  Location,
  LoginResponse,
  MeResponse,
  PhysicalCount,
  PhysicalCountDetail,
  Reconciliation,
  Ticket,
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
    me() {
      return client.request<MeResponse>('/me');
    },
    tickets(assetId: number) {
      return client.request<{ tickets: Ticket[] }>(`/assets/${assetId}/tickets`);
    },
    documents(assetId: number) {
      return client.request<{ documents: AssetDocument[] }>(
        `/assets/${assetId}/documents`,
      );
    },
    physicalCounts() {
      return client.request<{ physicalCounts: PhysicalCount[] }>(
        '/physical-counts',
      );
    },
    physicalCount(id: number) {
      return client.request<{ physicalCount: PhysicalCountDetail }>(
        `/physical-counts/${id}`,
      );
    },
    reconciliation(id: number) {
      return client.request<{ reconciliation: Reconciliation }>(
        `/physical-counts/${id}/reconciliation`,
      );
    },
    createCount(body: { name: string; locationId?: number }) {
      return client.request<{ physicalCount: PhysicalCount }>('/physical-counts', {
        method: 'POST',
        body,
      });
    },
    markItem(
      countId: number,
      itemId: number,
      body: { found?: boolean; notes?: string },
    ) {
      return client.request<{ item: CountItem }>(
        `/physical-counts/${countId}/items/${itemId}`,
        { method: 'PUT', body },
      );
    },
    completeCount(id: number) {
      return client.request<{ physicalCount: PhysicalCount }>(
        `/physical-counts/${id}/complete`,
        { method: 'POST' },
      );
    },
    uploadPhoto(countId: number, itemId: number, file: FormData) {
      return client.request<{ photo: { id: number } }>(
        `/physical-counts/${countId}/items/${itemId}/photos`,
        { method: 'POST', body: file },
      );
    },
    deletePhoto(countId: number, itemId: number, photoId: number) {
      return client.request<{ message?: string }>(
        `/physical-counts/${countId}/items/${itemId}/photos/${photoId}`,
        { method: 'DELETE' },
      );
    },
    downloadDocument(assetId: number, doc: AssetDocument) {
      return client.withAuth(async token => {
        const name = doc.originalName.replace(/[\\/]/g, '-');
        const dest = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/doc-${doc.id}-${name}`;
        const response = await ReactNativeBlobUtil.config({
          path: dest,
          fileCache: true,
        }).fetch(
          'GET',
          `${API_BASE}/assets/${assetId}/documents/${doc.id}/download`,
          { Authorization: `Bearer ${token}` },
        );
        const status = response.info().status;
        if (status === 401) {
          throw new ApiError(401, 'Token invalido o expirado');
        }
        if (status >= 400) {
          throw new ApiError(status, 'No se pudo descargar el documento');
        }
        const path = response.path();
        if (Platform.OS === 'android') {
          await ReactNativeBlobUtil.android.actionViewIntent(
            path,
            doc.mimeType || 'application/pdf',
          );
          return;
        }
        ReactNativeBlobUtil.ios.previewDocument(path);
      });
    },
    scanCount(countId: number, assetId: number) {
      return client.request<{ item: CountItem }>(
        `/physical-counts/${countId}/scan`,
        { method: 'POST', body: { assetId } },
      );
    },
  };
}

export type MobileApi = ReturnType<typeof createMobileApi>;
