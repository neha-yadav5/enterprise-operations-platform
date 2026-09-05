import { Injectable, computed, signal } from '@angular/core';

import { Asset, AssetDraft, AssetStatus } from '../models/asset.model';

@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly store = signal<Asset[]>(SEED);

  readonly assets = this.store.asReadonly();
  readonly count = computed(() => this.store().length);

  readonly statusCounts = computed(() => {
    const counts: Record<AssetStatus, number> = {
      Assigned: 0,
      Available: 0,
      'In repair': 0,
      Retired: 0,
    };
    for (const asset of this.store()) counts[asset.status] += 1;
    return counts;
  });

  /** Assigned as a share of everything not retired — the dashboard metric. */
  readonly utilisation = computed(() => {
    const live = this.store().filter((asset) => asset.status !== 'Retired');
    if (live.length === 0) return 0;
    const assigned = live.filter((asset) => asset.status === 'Assigned').length;
    return Math.round((assigned / live.length) * 100);
  });

  byId(id: string): Asset | undefined {
    return this.store().find((asset) => asset.id === id);
  }

  forEmployee(employeeId: string): Asset[] {
    return this.store().filter((asset) => asset.assigneeId === employeeId);
  }

  nextId(): string {
    const highest = this.store().reduce((max, asset) => {
      const numeric = Number(asset.id.replace(/\D/g, ''));
      return Number.isFinite(numeric) && numeric > max ? numeric : max;
    }, 8800);
    return `AST-${highest + 1}`;
  }

  update(id: string, patch: Partial<Asset>): void {
    this.store.update((assets) =>
      assets.map((asset) => (asset.id === id ? { ...asset, ...patch } : asset)),
    );
  }

  /**
   * Reassigns and records it in the asset's own history, so the History tab
   * reflects the change rather than silently going stale.
   */
  reassign(id: string, assigneeId: string | null, personLabel: string): void {
    this.store.update((assets) =>
      assets.map((asset) => {
        if (asset.id !== id) return asset;
        const event = assigneeId
          ? { date: STAMP, event: `Assigned to ${personLabel}`, personId: assigneeId }
          : { date: STAMP, event: 'Returned to stock', personId: asset.assigneeId };
        return {
          ...asset,
          assigneeId,
          status: assigneeId ? 'Assigned' : 'Available',
          history: [...asset.history, event],
        };
      }),
    );
  }

  add(draft: AssetDraft): Asset {
    const asset: Asset = {
      ...draft,
      id: draft.id?.trim() || this.nextId(),
      history: [{ date: STAMP, event: 'Asset registered', personId: null }],
    };
    this.store.update((assets) => [asset, ...assets]);
    return asset;
  }
}

/** Fixed stamp — see the note in RequestService about clock reads and SSR. */
const STAMP = '2026-09-05';

const SEED: Asset[] = [
  {
    id: 'AST-8801',
    name: 'MacBook Pro 16" M4',
    category: 'Laptop',
    serialNumber: 'C02X1234JGH7',
    status: 'Assigned',
    assigneeId: 'EMP-1023',
    location: 'Berlin',
    purchaseDate: '2026-03-14',
    purchaseCost: 3200,
    warrantyEnd: '2029-03-14',
    vendor: 'Apple',
    notes: 'Replacement issued after battery failure on the previous unit.',
    history: [
      { date: '2026-03-14', event: 'Asset registered', personId: null },
      { date: '2026-03-18', event: 'Assigned', personId: 'EMP-1023' },
    ],
  },
  {
    id: 'AST-8802',
    name: 'MacBook Pro 14" M3',
    category: 'Laptop',
    serialNumber: 'C02X9981KLM2',
    status: 'Assigned',
    assigneeId: 'EMP-1042',
    location: 'Lagos',
    purchaseDate: '2025-08-02',
    purchaseCost: 2400,
    warrantyEnd: '2028-08-02',
    vendor: 'Apple',
    notes: '',
    history: [
      { date: '2025-08-02', event: 'Asset registered', personId: null },
      { date: '2025-08-09', event: 'Assigned', personId: 'EMP-1042' },
    ],
  },
  {
    id: 'AST-8807',
    name: 'ThinkPad X1 Carbon',
    category: 'Laptop',
    serialNumber: 'PF3RTY88',
    status: 'In repair',
    assigneeId: 'EMP-1071',
    location: 'Remote',
    purchaseDate: '2024-11-20',
    purchaseCost: 1850,
    warrantyEnd: '2027-11-20',
    vendor: 'Lenovo',
    notes: 'Keyboard replacement under warranty — collected 28 August.',
    history: [
      { date: '2024-11-20', event: 'Asset registered', personId: null },
      { date: '2024-12-01', event: 'Assigned', personId: 'EMP-1071' },
      { date: '2026-08-28', event: 'Sent for repair', personId: 'EMP-1071' },
    ],
  },
  {
    id: 'AST-8812',
    name: 'Dell UltraSharp U2723QE',
    category: 'Monitor',
    serialNumber: 'CN0J7K221',
    status: 'Assigned',
    assigneeId: 'EMP-1052',
    location: 'Singapore',
    purchaseDate: '2025-02-11',
    purchaseCost: 640,
    warrantyEnd: '2028-02-11',
    vendor: 'Dell',
    notes: '',
    history: [
      { date: '2025-02-11', event: 'Asset registered', personId: null },
      { date: '2025-02-20', event: 'Assigned', personId: 'EMP-1052' },
    ],
  },
  {
    id: 'AST-8815',
    name: 'Dell UltraSharp U2723QE',
    category: 'Monitor',
    serialNumber: 'CN0J7K344',
    status: 'Available',
    assigneeId: null,
    location: 'London',
    purchaseDate: '2025-02-11',
    purchaseCost: 640,
    warrantyEnd: '2028-02-11',
    vendor: 'Dell',
    notes: 'Returned when the previous holder changed desk setup.',
    history: [
      { date: '2025-02-11', event: 'Asset registered', personId: null },
      { date: '2026-06-30', event: 'Returned to stock', personId: 'EMP-1094' },
    ],
  },
  {
    id: 'AST-8820',
    name: 'iPhone 16 Pro',
    category: 'Phone',
    serialNumber: 'DX4QW77LP',
    status: 'Assigned',
    assigneeId: 'EMP-1001',
    location: 'London',
    purchaseDate: '2026-01-08',
    purchaseCost: 1150,
    warrantyEnd: '2028-01-08',
    vendor: 'Apple',
    notes: '',
    history: [
      { date: '2026-01-08', event: 'Asset registered', personId: null },
      { date: '2026-01-10', event: 'Assigned', personId: 'EMP-1001' },
    ],
  },
  {
    id: 'AST-8824',
    name: 'Herman Miller Aeron',
    category: 'Furniture',
    serialNumber: 'HM-AER-4471',
    status: 'Assigned',
    assigneeId: 'EMP-1015',
    location: 'Singapore',
    purchaseDate: '2024-05-30',
    purchaseCost: 1400,
    warrantyEnd: '2036-05-30',
    vendor: 'Herman Miller',
    notes: '12-year warranty.',
    history: [
      { date: '2024-05-30', event: 'Asset registered', personId: null },
      { date: '2024-06-04', event: 'Assigned', personId: 'EMP-1015' },
    ],
  },
  {
    id: 'AST-8830',
    name: 'Figma Organization seat',
    category: 'Software licence',
    serialNumber: 'FIG-ORG-0091',
    status: 'Assigned',
    assigneeId: 'EMP-1102',
    location: 'Remote',
    purchaseDate: '2026-04-01',
    purchaseCost: 540,
    warrantyEnd: '2027-04-01',
    vendor: 'Figma',
    notes: 'Annual renewal, billed to Design.',
    history: [
      { date: '2026-04-01', event: 'Licence purchased', personId: null },
      { date: '2026-04-01', event: 'Assigned', personId: 'EMP-1102' },
    ],
  },
  {
    id: 'AST-8833',
    name: 'Logitech MX Master 3S',
    category: 'Peripheral',
    serialNumber: 'LG-MX3S-8891',
    status: 'Available',
    assigneeId: null,
    location: 'Berlin',
    purchaseDate: '2026-02-19',
    purchaseCost: 110,
    warrantyEnd: '2028-02-19',
    vendor: 'Logitech',
    notes: '',
    history: [{ date: '2026-02-19', event: 'Asset registered', personId: null }],
  },
  {
    id: 'AST-8840',
    name: 'MacBook Air M2',
    category: 'Laptop',
    serialNumber: 'C02Y5512PPQ',
    status: 'Assigned',
    assigneeId: 'EMP-1118',
    location: 'Lagos',
    purchaseDate: '2026-05-22',
    purchaseCost: 1300,
    warrantyEnd: '2029-05-22',
    vendor: 'Apple',
    notes: 'Intern loan unit — return on contract end.',
    history: [
      { date: '2026-05-22', event: 'Asset registered', personId: null },
      { date: '2026-06-01', event: 'Assigned', personId: 'EMP-1118' },
    ],
  },
  {
    id: 'AST-8712',
    name: 'ThinkPad T480',
    category: 'Laptop',
    serialNumber: 'PF1AB223',
    status: 'Retired',
    assigneeId: null,
    location: 'Warsaw',
    purchaseDate: '2020-09-14',
    purchaseCost: 1200,
    warrantyEnd: '2023-09-14',
    vendor: 'Lenovo',
    notes: 'Out of warranty and below the supported OS baseline. Awaiting disposal.',
    history: [
      { date: '2020-09-14', event: 'Asset registered', personId: null },
      { date: '2026-04-10', event: 'Retired', personId: null },
    ],
  },
  {
    id: 'AST-8845',
    name: 'Jabra Evolve2 65',
    category: 'Peripheral',
    serialNumber: 'JB-EV65-2210',
    status: 'Assigned',
    assigneeId: 'EMP-1080',
    location: 'Lagos',
    purchaseDate: '2025-10-03',
    purchaseCost: 230,
    warrantyEnd: '2027-10-03',
    vendor: 'Jabra',
    notes: '',
    history: [
      { date: '2025-10-03', event: 'Asset registered', personId: null },
      { date: '2025-10-08', event: 'Assigned', personId: 'EMP-1080' },
    ],
  },
];
