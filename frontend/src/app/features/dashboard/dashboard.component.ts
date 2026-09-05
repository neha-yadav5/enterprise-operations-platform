import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProjectService } from '../../core/project.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { KpiCardComponent, KpiTone } from '../../shared/kpi-card/kpi-card.component';
import { AreaChartComponent, AreaPoint } from '../../shared/charts/area-chart.component';
import { DonutChartComponent, DonutSlice } from '../../shared/charts/donut-chart.component';

interface Kpi {
  label: string;
  value: string;
  delta: string;
  sub: string;
  direction: 'up' | 'down';
  tone: KpiTone;
}

interface ActivityEntry {
  actor: string;
  action: string;
  target: string;
  when: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, IconComponent, KpiCardComponent, AreaChartComponent, DonutChartComponent],
  templateUrl: './dashboard.component.html',
  styles: [':host { display: block; }'],
})
export class DashboardComponent {
  readonly kpis = computed<Kpi[]>(() => [
    {
      label: 'Total employees',
      value: '1,284',
      delta: '+3.2%',
      sub: 'vs last quarter',
      direction: 'up',
      tone: 'positive',
    },
    {
      label: 'Active projects',
      value: String(this.activeProjects()),
      delta: '+6',
      sub: `${this.atRiskProjects()} at risk`,
      direction: 'up',
      tone: 'positive',
    },
    {
      label: 'Pending approvals',
      value: '23',
      delta: '−11%',
      sub: 'avg 1.4 days',
      direction: 'down',
      tone: 'neutral',
    },
    {
      label: 'Asset utilisation',
      value: '92%',
      delta: '+1.8%',
      sub: '3,410 assets',
      direction: 'up',
      tone: 'positive',
    },
  ]);

  /**
   * How much of the headcount series to show. Offered in months rather than
   * days because the series is monthly — a "last 30 days" option would render
   * a single point and mislead.
   */
  readonly windowMonths = signal(7);

  readonly ranges = [
    { months: 3, label: 'Last 3 months' },
    { months: 7, label: 'Last 7 months' },
  ];

  readonly rangeLabel = computed(
    () => this.ranges.find((r) => r.months === this.windowMonths())?.label ?? '',
  );

  readonly visibleHeadcount = computed(() => this.headcount.slice(-this.windowMonths()));

  onRange(event: Event): void {
    this.windowMonths.set(Number((event.target as HTMLSelectElement).value));
  }

  private readonly headcount: AreaPoint[] = [
    { label: 'Jan', value: 1105 },
    { label: 'Feb', value: 1128 },
    { label: 'Mar', value: 1160 },
    { label: 'Apr', value: 1195 },
    { label: 'May', value: 1222 },
    { label: 'Jun', value: 1254 },
    { label: 'Jul', value: 1284 },
  ];

  private readonly projectService = inject(ProjectService);

  /**
   * Derived from the project store rather than duplicated here, so the donut
   * and /projects can never disagree about how many projects are at risk.
   */
  readonly projectStatus = computed<DonutSlice[]>(() => {
    const counts = this.projectService.statusCounts();
    return [
      { label: 'On track', value: counts['On track'], color: 'rgb(var(--nx-color-success))' },
      { label: 'At risk', value: counts['At risk'], color: 'rgb(var(--nx-color-warning))' },
      { label: 'Blocked', value: counts['Blocked'], color: 'rgb(var(--nx-color-danger))' },
      { label: 'Completed', value: counts['Completed'], color: 'rgb(var(--nx-color-primary))' },
    ];
  });

  readonly projectTotal = this.projectService.count;
  readonly activeProjects = this.projectService.activeCount;
  readonly atRiskProjects = computed(() => this.projectService.statusCounts()['At risk']);

  readonly activity: ActivityEntry[] = [
    { actor: 'Priya Raman', action: 'approved', target: 'Travel request TR-2081', when: '12m ago' },
    { actor: 'Marco Bianchi', action: 'created', target: 'Project “Atlas Migration”', when: '48m ago' },
    { actor: 'Sarah Okafor', action: 'assigned', target: 'MacBook Pro 16" to L. Chen', when: '2h ago' },
    { actor: 'Elena Duarte', action: 'updated', target: 'Onboarding workflow v4', when: '3h ago' },
    { actor: 'Tomas Nowak', action: 'closed', target: 'Purchase request PR-1140', when: '5h ago' },
  ];
}
