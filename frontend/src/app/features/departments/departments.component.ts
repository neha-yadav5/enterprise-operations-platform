import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DepartmentService } from '../../core/department.service';
import { EmployeeService } from '../../core/employee.service';
import { Department } from '../../models/department.model';
import { fullName, initials } from '../../models/employee.model';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { IconComponent } from '../../shared/icon/icon.component';
import { ProgressBarComponent, ProgressTone } from '../../shared/progress-bar/progress-bar.component';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    IconComponent,
    AvatarComponent,
    ProgressBarComponent,
    HasPermissionDirective,
  ],
  templateUrl: './departments.component.html',
  styles: [':host { display: block; }'],
})
export class DepartmentsComponent {
  private readonly departmentService = inject(DepartmentService);
  private readonly employeeService = inject(EmployeeService);

  readonly search = signal('');

  readonly filtered = computed<Department[]>(() => {
    const needle = this.search().trim().toLowerCase();
    const all = this.departmentService.departments();
    if (!needle) return all;
    return all.filter((department) =>
      [department.name, department.location, department.description]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  });

  readonly total = this.departmentService.count;

  readonly totalOpenRoles = computed(() =>
    this.departmentService.departments().reduce((sum, d) => sum + d.openRoles, 0),
  );

  headcount = (department: Department) => this.departmentService.headcount(department);
  capacityPct = (department: Department) => this.departmentService.capacityPct(department);

  leadName(department: Department): string {
    const lead = this.employeeService.byId(department.leadId);
    return lead ? fullName(lead) : 'Unassigned';
  }

  leadInitials(department: Department): string {
    const lead = this.employeeService.byId(department.leadId);
    return lead ? initials(lead) : '—';
  }

  /** Over-capacity reads as a warning, not a success. */
  capacityTone(department: Department): ProgressTone {
    const pct = this.capacityPct(department);
    if (pct > 100) return 'warning';
    if (pct >= 90) return 'success';
    return 'primary';
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }
}
