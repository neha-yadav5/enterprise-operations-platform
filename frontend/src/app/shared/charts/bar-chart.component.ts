import { Component, Input, computed, signal } from '@angular/core';

export interface BarDatum {
  label: string;
  value: number;
}

/**
 * Horizontal bar chart for categorical comparison.
 *
 * Horizontal because the categories are words (department names), which read
 * straight rather than rotated. One series, so no legend — the caption names
 * it — and every bar is directly labelled with its value, so nobody has to
 * measure a bar against an axis. A table view sits behind it for screen
 * readers.
 */
@Component({
  selector: 'nx-bar-chart',
  standalone: true,
  templateUrl: './bar-chart.component.html',
  styles: [':host { display: block; }'],
})
export class BarChartComponent {
  @Input({ required: true }) set data(value: BarDatum[]) {
    this.rows.set(value ?? []);
  }

  @Input() caption = 'Comparison';
  @Input() valueSuffix = '';

  protected readonly rows = signal<BarDatum[]>([]);
  protected readonly activeIndex = signal<number | null>(null);

  /** Scale to the largest bar, not to a round ceiling — no wasted width. */
  protected readonly max = computed(() =>
    this.rows().reduce((highest, row) => Math.max(highest, row.value), 0),
  );

  protected readonly bars = computed(() =>
    this.rows().map((row, index) => ({
      ...row,
      index,
      pct: this.max() > 0 ? (row.value / this.max()) * 100 : 0,
    })),
  );
}
