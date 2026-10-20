import { ApiError } from '../api/client';
import type { CountItem } from '../api/types';

type ScanApi = {
  scanCount: (
    countId: number,
    assetId: number,
  ) => Promise<{ item: CountItem }>;
};

export async function runCountScan(
  api: ScanApi,
  countId: number,
  assetId: number,
): Promise<{ ok: true; code: string } | { ok: false; message: string }> {
  try {
    const result = await api.scanCount(countId, assetId);
    return { ok: true, code: result.item.asset.assetCode };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { ok: false, message: error.message };
    }
    throw error;
  }
}
