import { Component, Input } from '@angular/core';

export type KpiTone = 'positive' | 'negative' | 'neutral';

@Component({
  selector: 'nx-kpi-card',
  standalone: true,
  template: `
    <article class="rounded-lg border border-border-subtle bg-surface p-5 shadow-sm">
      <p class="nx-table-header">{{ label }}</p>

      <div class="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span class="nx-h1 tabular-nums">{{ value }}</span>

        @if (delta) {
          <span class="nx-caption font-medium" [class]="toneClass">
            <!-- Arrow plus sign: direction is never carried by colour alone. -->
            <span aria-hidden="true">{{ direction === 'down' ? '↘' : '↗' }}</span>
            {{ delta }}
          </span>
        }
      </div>

      @if (sub) {
        <p class="nx-caption mt-1">{{ sub }}</p>
      }
    </article>
  `,
  styles: [':host { display: block; }'],
})
export class KpiCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string;
  @Input() delta?: string;
  @Input() sub?: string;
  @Input() direction: 'up' | 'down' = 'up';

  /**
   * Decoupled from `direction` on purpose: pending approvals falling by 11% is
   * a good result, so the arrow and the sentiment must be set independently.
   */
  @Input() tone: KpiTone = 'positive';

  get toneClass(): string {
    switch (this.tone) {
      case 'positive':
        return 'text-success-text';
      case 'negative':
        return 'text-danger-text';
      default:
        return 'text-secondary-text';
    }
  }
}
