import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { AssetService } from '../../core/asset.service';
import { EmployeeService } from '../../core/employee.service';
import { AssetStatus } from '../../models/asset.model';
import { fullName, initials } from '../../models/employee.model';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { IconComponent } from '../../shared/icon/icon.component';
import { BadgeTone, StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

type TabId = 'overview' | 'history' | 'maintenance' | 'documents';

@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    CurrencyPipe,
    IconComponent,
    AvatarComponent,
    StatusBadgeComponent,
    HasPermissionDirective,
  ],
  templateUrl: './asset-detail.component.html',
  styles: [':host { display: block; }'],
})
export class AssetDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly assetService = inject(AssetService);
  private readonly employeeService = inject(EmployeeService);

  readonly tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'Assignment history' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'documents', label: 'Documents' },
  ];

  readonly activeTab = signal<TabId>('overview');

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );

  readonly asset = computed(() => this.assetService.byId(this.id()));

  readonly assignee = computed(() => {
    const asset = this.asset();
    return asset?.assigneeId ? this.employeeService.byId(asset.assigneeId) : undefined;
  });

  private readonly today = new Date('2026-09-05');

  readonly warrantyDaysLeft = computed(() => {
    const asset = this.asset();
    if (!asset) return 0;
    const end = new Date(asset.warrantyEnd);
    return Math.round((end.getTime() - this.today.getTime()) / 86_400_000);
  });

  name = fullName;
  initialsOf = initials;

  personName(id: string | null): string {
    if (!id) return '';
    const employee = this.employeeService.byId(id);
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

  warrantyTone(): BadgeTone {
    const days = this.warrantyDaysLeft();
    if (days < 0) return 'danger';
    if (days <= 90) return 'warning';
    return 'success';
  }

  warrantyLabel(): string {
    const days = this.warrantyDaysLeft();
    if (days < 0) return 'Expired';
    if (days <= 90) return `${days} days left`;
    return 'In warranty';
  }

  // --- Reassign ------------------------------------------------------------

  readonly reassigning = signal(false);
  readonly nextAssignee = signal('');

  readonly people = computed(() =>
    this.employeeService.employees().filter((employee) => employee.status !== 'Inactive'),
  );

  startReassign(): void {
    this.reassigning.set(true);
    this.nextAssignee.set(this.asset()?.assigneeId ?? '');
  }

  cancelReassign(): void {
    this.reassigning.set(false);
  }

  onAssignee(event: Event): void {
    this.nextAssignee.set((event.target as HTMLSelectElement).value);
  }

  confirmReassign(): void {
    const asset = this.asset();
    if (!asset) return;

    const id = this.nextAssignee();
    const person = id ? this.employeeService.byId(id) : undefined;
    this.assetService.reassign(asset.id, id || null, person ? fullName(person) : 'stock');
    this.reassigning.set(false);
  }
}
