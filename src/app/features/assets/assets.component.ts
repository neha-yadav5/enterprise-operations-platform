import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AssetService } from '../../core/asset.service';
import { CsvExportService } from '../../core/csv-export.service';
import { EmployeeService } from '../../core/employee.service';
import {
  ASSET_CATEGORIES,
  ASSET_STATUSES,
  Asset,
  AssetCategory,
  AssetStatus,
} from '../../models/asset.model';
import { fullName } from '../../models/employee.model';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { IconComponent } from '../../shared/icon/icon.component';
import { BadgeTone, StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    CurrencyPipe,
    IconComponent,
    StatusBadgeComponent,
    HasPermissionDirective,
  ],
  templateUrl: './assets.component.html',
  styles: [':host { display: block; }'],
})
export class AssetsComponent {
  private readonly assetService = inject(AssetService);
  private readonly employeeService = inject(EmployeeService);

  readonly categories = ASSET_CATEGORIES;
  readonly statuses = ASSET_STATUSES;
  readonly total = this.assetService.count;
  readonly utilisation = this.assetService.utilisation;
  readonly counts = this.assetService.statusCounts;

  private readonly route = inject(ActivatedRoute);

  /** Reactive, so drill-downs re-filter an already-mounted list. */
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly search = signal('');
  readonly category = signal<AssetCategory | 'All'>('All');
  readonly status = signal<AssetStatus | 'All'>('All');

  constructor() {
    effect(
      () => {
        const params = this.params();
        this.category.set((params.get('category') as AssetCategory | null) ?? 'All');
        this.status.set((params.get('status') as AssetStatus | null) ?? 'All');
      },
      { allowSignalWrites: true },
    );
  }

  readonly filtered = computed<Asset[]>(() => {
    const needle = this.search().trim().toLowerCase();
    const category = this.category();
    const status = this.status();

    return this.assetService.assets().filter((asset) => {
      if (category !== 'All' && asset.category !== category) return false;
      if (status !== 'All' && asset.status !== status) return false;
      if (!needle) return true;
      return [asset.name, asset.id, asset.serialNumber, asset.vendor, this.assigneeName(asset)]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  });

  readonly hasFilters = computed(
    () => this.search().trim() !== '' || this.category() !== 'All' || this.status() !== 'All',
  );

  assigneeName(asset: Asset): string {
    if (!asset.assigneeId) return 'Unassigned';
    const employee = this.employeeService.byId(asset.assigneeId);
    return employee ? fullName(employee) : 'Unknown';
  }

  toneFor(status: AssetStatus): BadgeTone {
    switch (status) {
      case 'Assigned':
        return 'success';
      case 'Available':
        return 'info';
      case 'In repair':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  /** Warranty inside 90 days of the fixed "today" reads as expiring. */
  private readonly today = new Date('2026-09-05');

  warrantyExpiring(asset: Asset): boolean {
    if (asset.status === 'Retired') return false;
    const end = new Date(asset.warrantyEnd);
    const days = (end.getTime() - this.today.getTime()) / 86_400_000;
    return days <= 90;
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  onCategory(event: Event): void {
    this.category.set((event.target as HTMLSelectElement).value as AssetCategory | 'All');
  }

  onStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value as AssetStatus | 'All');
  }

  clearFilters(): void {
    this.search.set('');
    this.category.set('All');
    this.status.set('All');
  }

  exportCsv(): void {
    this.csv.download(
      'nexusone-assets',
      ['Asset ID', 'Name', 'Category', 'Serial', 'Vendor', 'Assigned to', 'Location', 'Cost', 'Warranty ends', 'Status'],
      this.filtered().map((a) => [
        a.id,
        a.name,
        a.category,
        a.serialNumber,
        a.vendor,
        this.assigneeName(a),
        a.location,
        a.purchaseCost,
        a.warrantyEnd,
        a.status,
      ]),
    );
  }

  private readonly csv = inject(CsvExportService);
}
