import { DecimalPipe, LowerCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AnalyticsKpi, AnalyticsPeriod, AnalyticsService, PERIOD_LABELS, SavedView } from '../../core/analytics.service';
import { CsvExportService } from '../../core/csv-export.service';
import { DepartmentService } from '../../core/department.service';
import { AreaChartComponent } from '../../shared/charts/area-chart.component';
import { BarChartComponent } from '../../shared/charts/bar-chart.component';
import { DonutChartComponent } from '../../shared/charts/donut-chart.component';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    RouterLink,
    DecimalPipe,
    LowerCasePipe,
    IconComponent,
    BarChartComponent,
    AreaChartComponent,
    DonutChartComponent,
  ],
  templateUrl: './analytics.component.html',
  styles: [':host { display: block; }'],
})
export class AnalyticsComponent {
  private readonly service = inject(AnalyticsService);
  private readonly departmentService = inject(DepartmentService);

  readonly periods: AnalyticsPeriod[] = ['30d', '90d', '12m'];
  readonly periodLabels = PERIOD_LABELS;

  readonly period = this.service.period;
  readonly compare = this.service.compare;
  readonly department = this.service.department;
  readonly savedViews = this.service.savedViews;

  readonly kpis = this.service.kpis;
  readonly headcountByDepartment = this.service.headcountByDepartment;
  readonly hiringVelocity = this.service.hiringVelocity;
  readonly employeeStatus = this.service.employeeStatus;
  readonly projectStatus = this.service.projectStatus;
  readonly budgetByProject = this.service.budgetByProject;
  readonly requestsByType = this.service.requestsByType;
  readonly requestsByState = this.service.requestsByState;
  readonly assetsByCategory = this.service.assetsByCategory;
  readonly assetAvailability = this.service.assetAvailability;

  readonly departments = computed(() => [
    'All',
    ...this.departmentService.departments().map((d) => d.name),
  ]);

  readonly savingView = signal(false);
  readonly newViewName = signal('');

  readonly hiringMax = computed(() => {
    const highest = this.hiringVelocity().reduce((max, p) => Math.max(max, p.value), 0);
    return Math.max(4, Math.ceil(highest / 2) * 2);
  });

  readonly hiringTicks = computed(() => {
    const max = this.hiringMax();
    return [0, max / 2, max];
  });

  readonly isFiltered = computed(
    () => this.department() !== 'All' || this.period() !== '30d' || !this.compare(),
  );

  // --- KPI helpers ---------------------------------------------------------

  deltaPct(kpi: AnalyticsKpi): number {
    if (kpi.previous === 0) return kpi.value === 0 ? 0 : 100;
    return Math.round(((kpi.value - kpi.previous) / kpi.previous) * 100);
  }

  arrow(kpi: AnalyticsKpi): string {
    const delta = this.deltaPct(kpi);
    if (delta > 0) return '↗';
    if (delta < 0) return '↘';
    return '→';
  }

  /**
   * Sentiment is judged against what the metric wants, not the arrow: open
   * requests falling is good, headcount falling is not.
   */
  toneClass(kpi: AnalyticsKpi): string {
    const delta = this.deltaPct(kpi);
    if (delta === 0) return 'text-content-secondary';
    const good = delta > 0 ? kpi.riseIsGood : !kpi.riseIsGood;
    return good ? 'text-success-text' : 'text-danger-text';
  }

  // --- Toolbar handlers ----------------------------------------------------

  onPeriod(value: AnalyticsPeriod): void {
    this.period.set(value);
  }

  onDepartment(event: Event): void {
    this.department.set((event.target as HTMLSelectElement).value);
  }

  toggleCompare(): void {
    this.compare.update((value) => !value);
  }

  reset(): void {
    this.service.reset();
  }

  apply(view: SavedView): void {
    this.service.applyView(view);
  }

  remove(view: SavedView): void {
    this.service.deleteView(view.id);
  }

  startSave(): void {
    this.savingView.set(true);
  }

  cancelSave(): void {
    this.savingView.set(false);
    this.newViewName.set('');
  }

  onViewName(event: Event): void {
    this.newViewName.set((event.target as HTMLInputElement).value);
  }

  saveView(): void {
    const name = this.newViewName().trim();
    if (!name) return;
    this.service.saveView(name);
    this.cancelSave();
  }

  private readonly csv = inject(CsvExportService);

  /** Exports the KPI set under the filters currently applied. */
  exportCsv(): void {
    this.csv.download(
      `nexusone-analytics-${this.period()}`,
      ['Metric', 'Value', 'Unit', 'Previous', 'Change %', 'Scope', 'Period'],
      this.kpis().map((kpi) => [
        kpi.label,
        kpi.value,
        kpi.unit || 'count',
        kpi.previous,
        this.deltaPct(kpi),
        this.department(),
        this.periodLabels[this.period()],
      ]),
    );
  }
}
