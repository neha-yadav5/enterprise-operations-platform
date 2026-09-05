import { Injectable, computed, inject } from '@angular/core';

import { AssetService } from './asset.service';
import { DepartmentService } from './department.service';
import { EmployeeService } from './employee.service';
import { ProjectService } from './project.service';
import { RequestService } from './request.service';
import { BarDatum } from '../shared/charts/bar-chart.component';

export type ReportVisual = 'bar' | 'area' | 'donut';

export interface SavedReport {
  id: string;
  name: string;
  description: string;
  category: 'People' | 'Projects' | 'Assets' | 'Operations';
  visual: ReportVisual;
  /** Human description of the period the fixture data covers. */
  period: string;
}

/**
 * Reports are computed from the other stores rather than stored.
 *
 * That is the whole point of a reporting layer: if headcount by department
 * were a saved figure it would drift from the roster the moment somebody
 * joined. Every series here is derived on read.
 */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly employees = inject(EmployeeService);
  private readonly departments = inject(DepartmentService);
  private readonly projects = inject(ProjectService);
  private readonly assets = inject(AssetService);
  private readonly requests = inject(RequestService);

  readonly saved: SavedReport[] = [
    {
      id: 'headcount-by-department',
      name: 'Headcount by department',
      description: 'Active employees in each department, against the planned target.',
      category: 'People',
      visual: 'bar',
      period: 'Current',
    },
    {
      id: 'hiring-velocity',
      name: 'Hiring velocity',
      description: 'New starters per month across the trailing seven months.',
      category: 'People',
      visual: 'area',
      period: 'Rolling 7 months',
    },
    {
      id: 'project-status',
      name: 'Project status summary',
      description: 'Every initiative grouped by delivery status.',
      category: 'Projects',
      visual: 'donut',
      period: 'Current',
    },
    {
      id: 'project-budget',
      name: 'Budget committed by project',
      description: 'Spend to date against each project, highest first.',
      category: 'Projects',
      visual: 'bar',
      period: 'Financial year to date',
    },
    {
      id: 'assets-by-category',
      name: 'Assets by category',
      description: 'Inventory counts per asset category, excluding retired units.',
      category: 'Assets',
      visual: 'bar',
      period: 'Current',
    },
    {
      id: 'requests-by-type',
      name: 'Requests by type',
      description: 'Volume of requests raised, grouped by request type.',
      category: 'Operations',
      visual: 'bar',
      period: 'All time',
    },
  ];

  byId(id: string): SavedReport | undefined {
    return this.saved.find((report) => report.id === id);
  }

  readonly headcountByDepartment = computed<BarDatum[]>(() =>
    this.departments
      .departments()
      .map((department) => ({
        label: department.name,
        value: this.departments.headcount(department),
      }))
      .sort((a, b) => b.value - a.value),
  );

  readonly budgetByProject = computed<BarDatum[]>(() =>
    this.projects
      .projects()
      .map((project) => ({ label: project.name, value: Math.round(project.spent / 1000) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
  );

  readonly assetsByCategory = computed<BarDatum[]>(() => {
    const counts = new Map<string, number>();
    for (const asset of this.assets.assets()) {
      if (asset.status === 'Retired') continue;
      counts.set(asset.category, (counts.get(asset.category) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  });

  readonly requestsByType = computed<BarDatum[]>(() => {
    const counts = new Map<string, number>();
    for (const request of this.requests.requests()) {
      counts.set(request.type, (counts.get(request.type) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  });

  /** Starters per month, derived from each employee's start date. */
  readonly hiringVelocity = computed(() => {
    const months = [
      { label: 'Jan', key: '2026-01' },
      { label: 'Feb', key: '2026-02' },
      { label: 'Mar', key: '2026-03' },
      { label: 'Apr', key: '2026-04' },
      { label: 'May', key: '2026-05' },
      { label: 'Jun', key: '2026-06' },
      { label: 'Jul', key: '2026-07' },
    ];

    return months.map((month) => ({
      label: month.label,
      value: this.employees.employees().filter((e) => e.startDate.startsWith(month.key)).length,
    }));
  });

  readonly projectStatusSlices = computed(() => {
    const counts = this.projects.statusCounts();
    return [
      { label: 'On track', value: counts['On track'], color: 'rgb(var(--nx-color-success))' },
      { label: 'At risk', value: counts['At risk'], color: 'rgb(var(--nx-color-warning))' },
      { label: 'Blocked', value: counts['Blocked'], color: 'rgb(var(--nx-color-danger))' },
      { label: 'Completed', value: counts['Completed'], color: 'rgb(var(--nx-color-primary))' },
    ];
  });
}
