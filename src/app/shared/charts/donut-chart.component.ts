import { Component, Input, computed, signal } from '@angular/core';

export interface DonutSlice {
  label: string;
  value: number;
  /** A CSS colour, normally `rgb(var(--nx-color-success))` etc. */
  color: string;
}

const RADIUS = 66;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Surface gap between adjacent arcs, in viewBox units (~2px as rendered). */
const GAP = 3;

/**
 * Status donut.
 *
 * The palette validator flags two things about this status ramp: warning vs
 * success sit at ΔE 7.0 under protanopia (the 6–8 floor band), and amber is
 * 2.09:1 against the surface. Both are permitted ONLY with secondary encoding,
 * which is why every slice is separated by a real gap, named with its count in
 * the legend, and repeated in a table view. Never rely on the colour alone.
 */
@Component({
  selector: 'nx-donut-chart',
  standalone: true,
  templateUrl: './donut-chart.component.html',
  styles: [':host { display: block; }'],
})
export class DonutChartComponent {
  @Input({ required: true }) set data(value: DonutSlice[]) {
    this.slices.set(value ?? []);
  }

  @Input() caption = 'Breakdown';
  @Input() centreLabel = '';

  protected readonly slices = signal<DonutSlice[]>([]);
  protected readonly activeIndex = signal<number | null>(null);

  protected readonly radius = RADIUS;
  protected readonly circumference = CIRCUMFERENCE;

  protected readonly total = computed(() =>
    this.slices().reduce((sum, slice) => sum + slice.value, 0),
  );

  protected readonly arcs = computed(() => {
    const total = this.total();
    if (total <= 0) return [];

    let cursor = 0;
    return this.slices().map((slice, index) => {
      const length = (slice.value / total) * CIRCUMFERENCE;
      // Never let the gap eat a slice whole — a 1-unit stub still reads.
      const dash = Math.max(length - GAP, 1);
      const arc = {
        ...slice,
        index,
        dash,
        rest: CIRCUMFERENCE - dash,
        offset: -cursor,
        percent: (slice.value / total) * 100,
      };
      cursor += length;
      return arc;
    });
  });

  protected isActive(index: number): boolean {
    return this.activeIndex() === index;
  }
}
