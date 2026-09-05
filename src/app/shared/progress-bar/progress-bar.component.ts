import { Component, Input, computed, signal } from '@angular/core';

export type ProgressTone = 'primary' | 'success' | 'warning' | 'danger';

/**
 * Thin progress track.
 *
 * Carries `role="progressbar"` with the ARIA value trio, and the numeric
 * percentage is always rendered as text beside it — a bar whose only reading
 * is its own width is unusable for a screen reader and imprecise for everyone.
 */
@Component({
  selector: 'nx-progress-bar',
  standalone: true,
  template: `
    <div class="flex items-center gap-3">
      <div
        class="h-1.5 w-full overflow-hidden rounded-full bg-border-subtle"
        role="progressbar"
        [attr.aria-valuenow]="value"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-label]="label"
      >
        <div
          class="h-full rounded-full transition-[width] duration-300"
          [class]="fillClass()"
          [style.width.%]="clamped()"
        ></div>
      </div>

      @if (showValue) {
        <span class="nx-caption shrink-0 tabular-nums">{{ clamped() }}%</span>
      }
    </div>
  `,
  styles: [':host { display: block; }'],
})
export class ProgressBarComponent {
  @Input({ required: true }) set value(next: number) {
    this.raw.set(next);
  }
  get value(): number {
    return this.raw();
  }

  @Input() set tone(next: ProgressTone) {
    this.toneSignal.set(next);
  }

  @Input() label = 'Progress';
  @Input() showValue = true;

  private readonly raw = signal(0);
  private readonly toneSignal = signal<ProgressTone>('primary');

  protected readonly clamped = computed(() => Math.max(0, Math.min(100, Math.round(this.raw()))));

  protected readonly fillClass = computed(() => {
    switch (this.toneSignal()) {
      case 'success':
        return 'bg-success';
      case 'warning':
        return 'bg-warning';
      case 'danger':
        return 'bg-danger';
      default:
        return 'bg-primary';
    }
  });
}
