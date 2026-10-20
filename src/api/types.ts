export type AssetStatus = 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'SCRAP';

export type User = {
  id: number;
  fullName: string;
  email: string;
  role: { id: number; name: string };
};

export type Location = {
  id: number;
  name: string;
  parentId: number | null;
  path: string;
};

export type AssetSummary = {
  id: number;
  assetCode: string;
  brand: string;
  model: string;
  serialNumber: string;
  status: AssetStatus;
  assetType: string | null;
  assignedToName: string | null;
  description: string | null;
  locationPath: string | null;
};

export type Asset = {
  id: number;
  assetCode: string;
  brand: string;
  model: string;
  serialNumber: string;
  status: AssetStatus;
  assetType: string | null;
  processor: string | null;
  ramGb: number | null;
  storageGb: number | null;
  storageType: 'SSD' | 'HDD' | 'NVME' | null;
  purchaseDate: string | null;
  warrantyEnd: string | null;
  endOfLifeDate: string | null;
  assignedToName: string | null;
  assignedToDate: string | null;
  description: string | null;
  location: { id: number; name: string; path: string } | null;
  specifications: Record<string, unknown>;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
  permissions: string[];
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
};
