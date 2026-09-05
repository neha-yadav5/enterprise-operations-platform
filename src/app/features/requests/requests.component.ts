import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CsvExportService } from '../../core/csv-export.service';
import { EmployeeService } from '../../core/employee.service';
import { RequestService } from '../../core/request.service';
import { fullName, initials } from '../../models/employee.model';
import {
  REQUEST_STATES,
  REQUEST_TYPES,
  RequestItem,
  RequestState,
  RequestType,
} from '../../models/request.model';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { IconComponent } from '../../shared/icon/icon.component';
import { BadgeTone, StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-requests',
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
  templateUrl: './requests.component.html',
  styles: [':host { display: block; }'],
})
export class RequestsComponent {
  private readonly requestService = inject(RequestService);
  private readonly employeeService = inject(EmployeeService);

  readonly types = REQUEST_TYPES;
  readonly states = REQUEST_STATES;
  readonly total = this.requestService.count;
  readonly pending = this.requestService.pendingCount;

  private readonly route = inject(ActivatedRoute);

  /**
   * Reactive, not a one-off snapshot read. Angular reuses this component when
   * only the query string changes, so a drill-down clicked while already on
   * this screen would never re-filter off a snapshot.
   */
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly search = signal('');
  readonly type = signal<RequestType | 'All'>('All');
  readonly state = signal<RequestState | 'All'>('All');

  constructor() {
    effect(
      () => {
        const params = this.params();
        this.type.set((params.get('type') as RequestType | null) ?? 'All');
        this.state.set((params.get('state') as RequestState | null) ?? 'All');
      },
      { allowSignalWrites: true },
    );
  }

  readonly filtered = computed<RequestItem[]>(() => {
    const needle = this.search().trim().toLowerCase();
    const type = this.type();
    const state = this.state();

    return this.requestService.requests().filter((request) => {
      if (type !== 'All' && request.type !== type) return false;
      if (state !== 'All' && request.state !== state) return false;
      if (!needle) return true;
      return [request.id, request.title, request.type, this.requesterName(request)]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  });

  readonly hasFilters = computed(
    () => this.search().trim() !== '' || this.type() !== 'All' || this.state() !== 'All',
  );

  requesterName(request: RequestItem): string {
    const employee = this.employeeService.byId(request.requesterId);
    return employee ? fullName(employee) : 'Unknown';
  }

  requesterInitials(request: RequestItem): string {
    const employee = this.employeeService.byId(request.requesterId);
    return employee ? initials(employee) : '—';
  }

  /** The step currently blocking the request, for the "waiting on" column. */
  currentStep(request: RequestItem): string {
    const step = request.steps.find((s) => s.state === 'Current');
    return step ? step.name : '—';
  }

  toneFor(state: RequestState): BadgeTone {
    switch (state) {
      case 'Approved':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Rejected':
        return 'danger';
      default:
        return 'info';
    }
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  onType(event: Event): void {
    this.type.set((event.target as HTMLSelectElement).value as RequestType | 'All');
  }

  onState(event: Event): void {
    this.state.set((event.target as HTMLSelectElement).value as RequestState | 'All');
  }

  clearFilters(): void {
    this.search.set('');
    this.type.set('All');
    this.state.set('All');
  }

  exportCsv(): void {
    this.csv.download(
      'nexusone-requests',
      ['ID', 'Title', 'Type', 'Requester', 'Amount', 'Waiting on', 'Submitted', 'State'],
      this.filtered().map((r) => [
        r.id,
        r.title,
        r.type,
        this.requesterName(r),
        r.amount ?? '',
        this.currentStep(r),
        r.submittedAt,
        r.state,
      ]),
    );
  }

  private readonly csv = inject(CsvExportService);
}
