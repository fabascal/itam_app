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

export type MeResponse = {
  user: User;
  permissions: string[];
};

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'PROVIDER'
  | 'CLOSED'
  | 'CANCELLED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketLevel = 'LEVEL_1' | 'LEVEL_2' | 'PROVEEDOR';

export type TicketEvent = {
  id: number;
  action: string;
  details: Record<string, unknown>;
  createdAt: string;
  actor: { id: number; fullName: string } | null;
};

export type Ticket = {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  level: TicketLevel;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: number; fullName: string } | null;
  events: TicketEvent[];
};

export type AssetDocument = {
  id: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  assignedToName: string | null;
  assignedToDate: string | null;
  createdAt: string;
  uploadedBy: { id: number; fullName: string } | null;
};

export type CountStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';

export type PhysicalCount = {
  id: number;
  name: string;
  status: CountStatus;
  locationId?: number | null;
  location?: { id: number; name: string; path: string } | null;
  createdAt?: string;
};

export type CountPhoto = {
  id: number;
};

export type CountItem = {
  id: number;
  found: boolean;
  notes: string | null;
  verifiedAt: string | null;
  asset: {
    id: number;
    assetCode: string;
    brand: string;
    model: string;
    serialNumber: string;
  };
  photos: CountPhoto[];
};

export type PhysicalCountDetail = PhysicalCount & {
  items: CountItem[];
};

export type Reconciliation = {
  total?: number;
  found?: number;
  missing?: number;
  expected?: number;
};
