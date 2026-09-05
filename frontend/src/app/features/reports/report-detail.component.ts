import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { CsvExportService } from '../../core/csv-export.service';
import { ReportService } from '../../core/report.service';
import { AreaChartComponent, AreaPoint } from '../../shared/charts/area-chart.component';
import { BarChartComponent, BarDatum } from '../../shared/charts/bar-chart.component';
import { DonutChartComponent, DonutSlice } from '../../shared/charts/donut-chart.component';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [
    RouterLink,
    DecimalPipe,
    IconComponent,
    BarChartComponent,
    AreaChartComponent,
    DonutChartComponent,
  ],
  templateUrl: './report-detail.component.html',
  styles: [':host { display: block; }'],
})
export class ReportDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ReportService);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );

  readonly report = computed(() => this.service.byId(this.id()));

  readonly bars = computed<BarDatum[]>(() => {
    switch (this.id()) {
      case 'headcount-by-department':
        return this.service.headcountByDepartment();
      case 'project-budget':
        return this.service.budgetByProject();
      case 'assets-by-category':
        return this.service.assetsByCategory();
      case 'requests-by-type':
        return this.service.requestsByType();
      default:
        return [];
    }
  });

  readonly area = computed<AreaPoint[]>(() =>
    this.id() === 'hiring-velocity' ? this.service.hiringVelocity() : [],
  );

  readonly slices = computed<DonutSlice[]>(() =>
    this.id() === 'project-status' ? this.service.projectStatusSlices() : [],
  );

  /** Budget is reported in thousands, so the bars need a unit. */
  readonly suffix = computed(() => (this.id() === 'project-budget' ? 'k' : ''));

  readonly areaMax = computed(() => {
    const highest = this.area().reduce((max, point) => Math.max(max, point.value), 0);
    return Math.max(4, Math.ceil(highest / 2) * 2);
  });

  readonly areaTicks = computed(() => {
    const max = this.areaMax();
    return [0, max / 2, max];
  });

  readonly total = computed(() => {
    const bars = this.bars();
    if (bars.length > 0) return bars.reduce((sum, bar) => sum + bar.value, 0);
    const slices = this.slices();
    if (slices.length > 0) return slices.reduce((sum, slice) => sum + slice.value, 0);
    return this.area().reduce((sum, point) => sum + point.value, 0);
  });

  private readonly csv = inject(CsvExportService);

  /**
   * Reports are computed from the live stores, so "Run" has nothing to fetch —
   * it re-reads and stamps when that happened, which is the honest version of
   * a refresh button over derived data.
   */
  readonly runCount = signal(0);

  run(): void {
    this.runCount.update((n) => n + 1);
  }

  exportCsv(): void {
    const report = this.report();
    if (!report) return;

    const total = this.total();
    this.csv.download(
      `nexusone-${report.id}`,
      ['Category', 'Value', 'Share %'],
      this.rows().map((row) => [
        row.label,
        `${row.value}${this.suffix()}`,
        total > 0 ? ((row.value / total) * 100).toFixed(1) : '0',
      ]),
    );
  }

  readonly rows = computed<{ label: string; value: number }[]>(() => {
    const bars = this.bars();
    if (bars.length > 0) return bars;
    const slices = this.slices();
    if (slices.length > 0) return slices.map((s) => ({ label: s.label, value: s.value }));
    return this.area();
  });
}
