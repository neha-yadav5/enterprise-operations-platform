import { DecimalPipe } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';

export interface AreaPoint {
  label: string;
  value: number;
}

const W = 720;
const H = 240;
const PAD = { top: 12, right: 12, bottom: 28, left: 46 };

/**
 * Single-series area chart, drawn as inline SVG.
 *
 * No charting library: everything here has to survive prerendering, and the
 * SSR-safe subset of a canvas-based library is "don't render on the server".
 * A single series carries no legend — the card title names it (dataviz rule).
 * Hover uses one transparent band per point rather than pointer coordinate
 * maths, so it needs no DOM measurement and degrades cleanly without JS.
 */
@Component({
  selector: 'nx-area-chart',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './area-chart.component.html',
  styles: [':host { display: block; }'],
})
export class AreaChartComponent {
  @Input({ required: true }) set data(value: AreaPoint[]) {
    this.points.set(value ?? []);
  }

  /** Accessible name for the figure. */
  @Input() caption = 'Trend';

  /** Y-axis ceiling. Left explicit so the axis reads in round numbers. */
  @Input() max = 1400;

  @Input() ticks: number[] = [0, 350, 700, 1050, 1400];

  protected readonly points = signal<AreaPoint[]>([]);
  protected readonly activeIndex = signal<number | null>(null);

  protected readonly viewBox = `0 0 ${W} ${H}`;
  protected readonly plotBottom = H - PAD.bottom;
  protected readonly plotLeft = PAD.left;
  protected readonly plotRight = W - PAD.right;

  protected readonly coords = computed(() =>
    this.points().map((point, index) => ({
      ...point,
      index,
      x: this.xFor(index),
      y: this.yFor(point.value),
      /** Percentage across the plot, for positioning the HTML tooltip. */
      leftPct: ((this.xFor(index) - PAD.left) / (W - PAD.left - PAD.right)) * 100,
    })),
  );

  protected readonly linePath = computed(() =>
    this.coords()
      .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' '),
  );

  protected readonly areaPath = computed(() => {
    const c = this.coords();
    if (c.length === 0) return '';
    const first = c[0];
    const last = c[c.length - 1];
    return `${this.linePath()} L${last.x.toFixed(1)} ${this.plotBottom} L${first.x.toFixed(1)} ${this.plotBottom} Z`;
  });

  protected readonly active = computed(() => {
    const index = this.activeIndex();
    return index === null ? null : (this.coords()[index] ?? null);
  });

  protected readonly bandWidth = computed(() => {
    const n = this.points().length;
    return n > 1 ? (W - PAD.left - PAD.right) / n : 0;
  });

  protected yFor(value: number): number {
    const usable = H - PAD.top - PAD.bottom;
    return PAD.top + (1 - value / this.max) * usable;
  }

  protected xFor(index: number): number {
    const n = this.points().length;
    if (n <= 1) return PAD.left;
    return PAD.left + (index * (W - PAD.left - PAD.right)) / (n - 1);
  }

  protected bandX(index: number): number {
    return PAD.left + index * this.bandWidth();
  }
}
