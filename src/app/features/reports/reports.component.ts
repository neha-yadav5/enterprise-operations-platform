import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CsvExportService } from '../../core/csv-export.service';
import { ReportService, SavedReport } from '../../core/report.service';
import { IconComponent, IconName } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './reports.component.html',
  styles: [':host { display: block; }'],
})
export class ReportsComponent {
  private readonly service = inject(ReportService);

  readonly categories = ['All', 'People', 'Projects', 'Assets', 'Operations'] as const;
  readonly category = signal<(typeof this.categories)[number]>('All');

  readonly reports = computed<SavedReport[]>(() => {
    const category = this.category();
    return category === 'All'
      ? this.service.saved
      : this.service.saved.filter((report) => report.category === category);
  });

  readonly total = this.service.saved.length;

  iconFor(report: SavedReport): IconName {
    switch (report.visual) {
      case 'area':
        return 'line-chart';
      case 'donut':
        return 'folder';
      default:
        return 'bar-chart';
    }
  }

  select(category: (typeof this.categories)[number]): void {
    this.category.set(category);
  }

  private readonly csv = inject(CsvExportService);

  /**
   * Exports the catalogue, not every report's data — one file per report is
   * what the individual CSV button on each report is for.
   */
  exportCatalogue(): void {
    this.csv.download(
      'nexusone-report-catalogue',
      ['ID', 'Report', 'Category', 'Period', 'Visualisation', 'Description'],
      this.reports().map((r) => [r.id, r.name, r.category, r.period, r.visual, r.description]),
    );
  }
}
