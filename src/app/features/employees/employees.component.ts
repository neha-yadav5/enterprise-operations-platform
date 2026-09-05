import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CsvExportService } from '../../core/csv-export.service';
import { EmployeeService } from '../../core/employee.service';
import {
  EMPLOYEE_STATUSES,
  Employee,
  EmployeeStatus,
  fullName,
  initials,
} from '../../models/employee.model';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { IconComponent } from '../../shared/icon/icon.component';
import { BadgeTone, StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    IconComponent,
    AvatarComponent,
    StatusBadgeComponent,
    HasPermissionDirective,
  ],
  templateUrl: './employees.component.html',
  styles: [':host { display: block; }'],
})
export class EmployeesComponent {
  private readonly service = inject(EmployeeService);

  readonly statuses = EMPLOYEE_STATUSES;
  readonly departments = this.service.departmentsInUse;

  private readonly route = inject(ActivatedRoute);

  /**
   * Reactive so an Analytics drill-down lands pre-filtered even when the
   * component is already mounted and only the query string changes.
   */
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly search = signal('');
  readonly department = signal<string>('All');
  readonly status = signal<EmployeeStatus | 'All'>('All');

  constructor() {
    effect(
      () => {
        const params = this.params();
        this.department.set(params.get('department') ?? 'All');
        this.status.set((params.get('status') as EmployeeStatus | null) ?? 'All');
      },
      { allowSignalWrites: true },
    );
  }

  readonly total = this.service.count;

  readonly filtered = computed<Employee[]>(() => {
    const needle = this.search().trim().toLowerCase();
    const department = this.department();
    const status = this.status();

    return this.service.employees().filter((employee) => {
      if (department !== 'All' && employee.department !== department) return false;
      if (status !== 'All' && employee.status !== status) return false;
      if (!needle) return true;

      return [fullName(employee), employee.email, employee.id, employee.title]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  });

  readonly hasFilters = computed(
    () => this.search().trim() !== '' || this.department() !== 'All' || this.status() !== 'All',
  );

  name = fullName;
  initialsOf = initials;

  toneFor(status: EmployeeStatus): BadgeTone {
    switch (status) {
      case 'Active':
        return 'success';
      case 'On leave':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  onDepartment(event: Event): void {
    this.department.set((event.target as HTMLSelectElement).value);
  }

  onStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value as EmployeeStatus | 'All');
  }

  clearFilters(): void {
    this.search.set('');
    this.department.set('All');
    this.status.set('All');
  }

  /** Exports what is on screen, not the whole roster. */
  exportCsv(): void {
    this.csv.download(
      'nexusone-employees',
      ['Employee ID', 'Name', 'Email', 'Title', 'Department', 'Location', 'Type', 'Status', 'Start date'],
      this.filtered().map((e) => [
        e.id,
        fullName(e),
        e.email,
        e.title,
        e.department,
        e.location,
        e.employmentType,
        e.status,
        e.startDate,
      ]),
    );
  }

  private readonly csv = inject(CsvExportService);
}
