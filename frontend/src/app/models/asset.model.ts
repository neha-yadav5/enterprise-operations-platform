export type AssetStatus = 'Assigned' | 'Available' | 'In repair' | 'Retired';

export type AssetCategory =
  | 'Laptop'
  | 'Monitor'
  | 'Phone'
  | 'Peripheral'
  | 'Furniture'
  | 'Software licence';

export interface AssetEvent {
  date: string;
  event: string;
  /** Employee involved, when the event concerns a person. */
  personId: string | null;
}

export interface Asset {
  /** Business identifier, e.g. AST-8801. */
  id: string;
  name: string;
  category: AssetCategory;
  serialNumber: string;
  status: AssetStatus;
  assigneeId: string | null;
  location: string;
  purchaseDate: string;
  purchaseCost: number;
  warrantyEnd: string;
  vendor: string;
  notes: string;
  history: AssetEvent[];
}

export interface AssetDraft extends Omit<Asset, 'id' | 'history'> {
  id?: string;
}

export const ASSET_CATEGORIES: AssetCategory[] = [
  'Laptop',
  'Monitor',
  'Phone',
  'Peripheral',
  'Furniture',
  'Software licence',
];

export const ASSET_STATUSES: AssetStatus[] = ['Assigned', 'Available', 'In repair', 'Retired'];
