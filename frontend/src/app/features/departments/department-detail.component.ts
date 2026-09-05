import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { DepartmentService } from '../../core/department.service';
import { EmployeeService } from '../../core/employee.service';
import { ProjectService } from '../../core/project.service';
import { EmployeeStatus, fullName, initials } from '../../models/employee.model';
import { ProjectStatus } from '../../models/project.model';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { IconComponent } from '../../shared/icon/icon.component';
import { ProgressBarComponent, ProgressTone } from '../../shared/progress-bar/progress-bar.component';
import { BadgeTone, StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

type TabId = 'overview' | 'employees' | 'projects' | 'roles' | 'budget';

@Component({
  selector: 'app-department-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    CurrencyPipe,
    IconComponent,
    AvatarComponent,
    StatusBadgeComponent,
    ProgressBarComponent,
    HasPermissionDirective,
  ],
  templateUrl: './department-detail.component.html',
  styles: [':host { display: block; }'],
})
export class DepartmentDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly departmentService = inject(DepartmentService);
  private readonly employeeService = inject(EmployeeService);
  private readonly projectService = inject(ProjectService);

  readonly tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'employees', label: 'Employees' },
    { id: 'projects', label: 'Projects' },
    { id: 'roles', label: 'Open roles' },
    { id: 'budget', label: 'Budget' },
  ];

  readonly activeTab = signal<TabId>('overview');

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );

  readonly department = computed(() => this.departmentService.byId(this.id()));

  readonly lead = computed(() => {
    const department = this.department();
    return department ? this.employeeService.byId(department.leadId) : undefined;
  });

  readonly staff = computed(() => {
    const department = this.department();
    return department ? this.departmentService.staff(department) : [];
  });

  readonly projects = computed(() => {
    const department = this.department();
    if (!department) return [];
    return this.projectService.projects().filter((p) => p.department === department.name);
  });

  readonly headcount = computed(() => {
    const department = this.department();
    return department ? this.departmentService.headcount(department) : 0;
  });

  readonly capacityPct = computed(() => {
    const department = this.department();
    return department ? this.departmentService.capacityPct(department) : 0;
  });

  readonly budgetUsedPct = computed(() => {
    const department = this.department();
    if (!department || department.budget === 0) return 0;
    return Math.round((department.spent / department.budget) * 100);
  });

  readonly remaining = computed(() => {
    const department = this.department();
    return department ? department.budget - department.spent : 0;
  });

  name = fullName;
  initialsOf = initials;

  employeeTone(status: EmployeeStatus): BadgeTone {
    switch (status) {
      case 'Active':
        return 'success';
      case 'On leave':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  projectTone(status: ProjectStatus): BadgeTone {
    switch (status) {
      case 'On track':
        return 'success';
      case 'At risk':
        return 'warning';
      case 'Blocked':
        return 'danger';
      default:
        return 'info';
    }
  }

  capacityTone(): ProgressTone {
    const pct = this.capacityPct();
    if (pct > 100) return 'warning';
    if (pct >= 90) return 'success';
    return 'primary';
  }

  budgetTone(): ProgressTone {
    const used = this.budgetUsedPct();
    if (used > 100) return 'danger';
    if (used >= 85) return 'warning';
    return 'primary';
  }
}
