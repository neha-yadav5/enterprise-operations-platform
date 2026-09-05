import { Injectable, computed, inject, signal } from '@angular/core';

import { AssetService } from './asset.service';
import { DepartmentService } from './department.service';
import { DocumentService } from './document.service';
import { EmployeeService } from './employee.service';
import { ProjectService } from './project.service';
import { RequestService } from './request.service';
import { BarDatum } from '../shared/charts/bar-chart.component';
import { DonutSlice } from '../shared/charts/donut-chart.component';

export type AnalyticsPeriod = '30d' | '90d' | '12m';

export interface AnalyticsKpi {
  key: string;
  label: string;
  value: number;
  previous: number;
  unit: '' | '%';
  /** Whether a rise is good, so the tone is not read off the arrow. */
  riseIsGood: boolean;
  /** Explains how the number is derived, shown as a tooltip. */
  explanation: string;
  /** Where the drill-down goes, with filters carried as query params. */
  drill: { link: string[]; params: Record<string, string> } | null;
}

export interface SavedView {
  id: string;
  name: string;
  period: AnalyticsPeriod;
  compare: boolean;
  department: string;
}

export const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '12m': 'Last 12 months',
};

/**
 * Analytics read model.
 *
 * Every current figure is derived from the operational stores, so Analytics can
 * never disagree with the screen it drills into. Previous-period figures are
 * fixtures: the stores hold no history, and inventing a trend from data that
 * does not exist would be worse than declaring the comparison synthetic.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly employees = inject(EmployeeService);
  private readonly departments = inject(DepartmentService);
  private readonly projects = inject(ProjectService);
  private readonly requests = inject(RequestService);
  private readonly assets = inject(AssetService);
  private readonly documents = inject(DocumentService);

  readonly period = signal<AnalyticsPeriod>('30d');
  readonly compare = signal(true);
  readonly department = signal<string>('All');

  readonly savedViews = signal<SavedView[]>([
    { id: 'view-1', name: 'Exec monthly', period: '30d', compare: true, department: 'All' },
    { id: 'view-2', name: 'Engineering quarter', period: '90d', compare: true, department: 'Engineering' },
  ]);

  /** Employees inside the current department filter. */
  private readonly scopedEmployees = computed(() => {
    const department = this.department();
    const all = this.employees.employees().filter((e) => e.status !== 'Inactive');
    return department === 'All' ? all : all.filter((e) => e.department === department);
  });

  private readonly scopedProjects = computed(() => {
    const department = this.department();
    const all = this.projects.projects();
    return department === 'All' ? all : all.filter((p) => p.department === department);
  });

  readonly kpis = computed<AnalyticsKpi[]>(() => {
    const factor = PREVIOUS_FACTOR[this.period()];

    const headcount = this.scopedEmployees().length;
    const activeProjects = this.scopedProjects().filter((p) => p.status !== 'Completed').length;
    const openRequests = this.requests.requests().filter((r) => r.state === 'Pending').length;

    const decided = this.requests.requests().filter((r) => r.state !== 'Pending');
    const approved = decided.filter((r) => r.state === 'Approved').length;
    const approvalRate = decided.length ? Math.round((approved / decided.length) * 100) : 0;

    const utilisation = this.assets.utilisation();
    const documents = this.documents.count();

    // Typed locally so each literal's `unit` narrows to the '' | '%' union
    // rather than widening to string.
    const list: AnalyticsKpi[] = [
      {
        key: 'headcount',
        label: 'Total employees',
        value: headcount,
        previous: Math.max(0, Math.round(headcount * factor.headcount)),
        unit: '',
        riseIsGood: true,
        explanation: 'Active and on-leave employees inside the current department filter.',
        drill: { link: ['/employees'], params: this.departmentParam() },
      },
      {
        key: 'active-projects',
        label: 'Active projects',
        value: activeProjects,
        previous: Math.max(0, Math.round(activeProjects * factor.projects)),
        unit: '',
        riseIsGood: true,
        explanation: 'Projects whose status is anything other than Completed.',
        drill: { link: ['/projects'], params: {} },
      },
      {
        key: 'open-requests',
        label: 'Open requests',
        value: openRequests,
        previous: Math.max(0, Math.round(openRequests * factor.requests)),
        unit: '',
        riseIsGood: false,
        explanation: 'Requests still awaiting a decision at any step of their chain.',
        drill: { link: ['/requests'], params: { state: 'Pending' } },
      },
      {
        key: 'approval-rate',
        label: 'Approval rate',
        value: approvalRate,
        previous: Math.max(0, Math.round(approvalRate * factor.approval)),
        unit: '%',
        riseIsGood: true,
        explanation: 'Approved as a share of every request that has reached a decision.',
        drill: { link: ['/requests'], params: { state: 'Approved' } },
      },
      {
        key: 'asset-utilisation',
        label: 'Asset utilisation',
        value: utilisation,
        previous: Math.max(0, Math.round(utilisation * factor.assets)),
        unit: '%',
        riseIsGood: true,
        explanation: 'Assigned assets as a share of everything not retired.',
        drill: { link: ['/assets'], params: { status: 'Assigned' } },
      },
      {
        key: 'documents',
        label: 'Documents',
        value: documents,
        previous: Math.max(0, Math.round(documents * factor.documents)),
        unit: '',
        riseIsGood: true,
        explanation: 'Every document record, including drafts and archived versions.',
        drill: { link: ['/documents'], params: {} },
      },
    ];

    return list;
  });

  /** Empty rather than undefined, so every KPI's `params` has one shape. */
  private departmentParam(): Record<string, string> {
    const department = this.department();
    return department === 'All' ? {} : { department };
  }

  // --- Section series ------------------------------------------------------

  readonly headcountByDepartment = computed<BarDatum[]>(() =>
    this.departments
      .departments()
      .map((department) => ({
        label: department.name,
        value: this.departments.headcount(department),
      }))
      .filter((row) => this.department() === 'All' || row.label === this.department())
      .sort((a, b) => b.value - a.value),
  );

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
      value: this.scopedEmployees().filter((e) => e.startDate.startsWith(month.key)).length,
    }));
  });

  readonly employeeStatus = computed<DonutSlice[]>(() => {
    const all = this.employees
      .employees()
      .filter((e) => this.department() === 'All' || e.department === this.department());
    return [
      {
        label: 'Active',
        value: all.filter((e) => e.status === 'Active').length,
        color: 'rgb(var(--nx-color-success))',
      },
      {
        label: 'On leave',
        value: all.filter((e) => e.status === 'On leave').length,
        color: 'rgb(var(--nx-color-warning))',
      },
      {
        label: 'Inactive',
        value: all.filter((e) => e.status === 'Inactive').length,
        color: 'rgb(var(--nx-color-text-secondary))',
      },
    ].filter((slice) => slice.value > 0);
  });

  readonly projectStatus = computed<DonutSlice[]>(() => {
    const scoped = this.scopedProjects();
    const count = (status: string) => scoped.filter((p) => p.status === status).length;
    return [
      { label: 'On track', value: count('On track'), color: 'rgb(var(--nx-color-success))' },
      { label: 'At risk', value: count('At risk'), color: 'rgb(var(--nx-color-warning))' },
      { label: 'Blocked', value: count('Blocked'), color: 'rgb(var(--nx-color-danger))' },
      { label: 'Completed', value: count('Completed'), color: 'rgb(var(--nx-color-primary))' },
    ].filter((slice) => slice.value > 0);
  });

  readonly budgetByProject = computed<BarDatum[]>(() =>
    this.scopedProjects()
      .map((project) => ({ label: project.name, value: Math.round(project.spent / 1000) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6),
  );

  readonly requestsByType = computed<BarDatum[]>(() => {
    const counts = new Map<string, number>();
    for (const request of this.requests.requests()) {
      counts.set(request.type, (counts.get(request.type) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  });

  readonly requestsByState = computed<DonutSlice[]>(() => {
    const all = this.requests.requests();
    const count = (state: string) => all.filter((r) => r.state === state).length;
    return [
      { label: 'Approved', value: count('Approved'), color: 'rgb(var(--nx-color-success))' },
      { label: 'Pending', value: count('Pending'), color: 'rgb(var(--nx-color-warning))' },
      { label: 'Rejected', value: count('Rejected'), color: 'rgb(var(--nx-color-danger))' },
      {
        label: 'Changes requested',
        value: count('Changes requested'),
        color: 'rgb(var(--nx-color-primary))',
      },
    ].filter((slice) => slice.value > 0);
  });

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

  readonly assetAvailability = computed<DonutSlice[]>(() => {
    const counts = this.assets.statusCounts();
    return [
      { label: 'Assigned', value: counts.Assigned, color: 'rgb(var(--nx-color-success))' },
      { label: 'Available', value: counts.Available, color: 'rgb(var(--nx-color-primary))' },
      { label: 'In repair', value: counts['In repair'], color: 'rgb(var(--nx-color-warning))' },
      {
        label: 'Retired',
        value: counts.Retired,
        color: 'rgb(var(--nx-color-text-secondary))',
      },
    ].filter((slice) => slice.value > 0);
  });

  // --- Saved views ---------------------------------------------------------

  applyView(view: SavedView): void {
    this.period.set(view.period);
    this.compare.set(view.compare);
    this.department.set(view.department);
  }

  saveView(name: string): SavedView {
    const view: SavedView = {
      id: `view-${this.savedViews().length + 1}-${name.length}`,
      name,
      period: this.period(),
      compare: this.compare(),
      department: this.department(),
    };
    this.savedViews.update((views) => [...views, view]);
    return view;
  }

  deleteView(id: string): void {
    this.savedViews.update((views) => views.filter((view) => view.id !== id));
  }

  reset(): void {
    this.period.set('30d');
    this.compare.set(true);
    this.department.set('All');
  }
}

/**
 * Multipliers used to synthesise the previous-period figure. Declared here
 * rather than buried in the KPI list so it is obvious these are not measured.
 */
const PREVIOUS_FACTOR: Record<
  AnalyticsPeriod,
  { headcount: number; projects: number; requests: number; approval: number; assets: number; documents: number }
> = {
  '30d': { headcount: 0.97, projects: 0.9, requests: 1.12, approval: 0.94, assets: 0.98, documents: 0.92 },
  '90d': { headcount: 0.92, projects: 0.82, requests: 1.25, approval: 0.89, assets: 0.95, documents: 0.8 },
  '12m': { headcount: 0.78, projects: 0.65, requests: 1.4, approval: 0.85, assets: 0.88, documents: 0.6 },
};
