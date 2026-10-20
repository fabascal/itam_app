export type AssetQr = {
  id: number;
  code: string;
};

export function parseAssetQr(text: string): AssetQr | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (data === null || typeof data !== 'object') {
    return null;
  }
  const qr = data as Record<string, unknown>;
  if (qr.t !== 'asset' || qr.v !== 1) {
    return null;
  }
  if (typeof qr.id !== 'number' || !Number.isInteger(qr.id)) {
    return null;
  }
  if (typeof qr.c !== 'string' || qr.c.length === 0) {
    return null;
  }
  return { id: qr.id, code: qr.c };
}
