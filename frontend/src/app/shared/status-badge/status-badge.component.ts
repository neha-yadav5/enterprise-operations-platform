import { Component, Input, computed, signal } from '@angular/core';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

/**
 * Status pill.
 *
 * Always renders a dot AND its label. Status is never carried by colour alone —
 * amber sits at 2.09:1 against surface, so the word is what actually
 * communicates state to a colourblind or low-vision reader.
 */
@Component({
  selector: 'nx-status-badge',
  standalone: true,
  template: `
    <span
      class="nx-caption inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium"
      [class]="classes()"
    >
      <span class="h-1.5 w-1.5 rounded-full" [class]="dotClass()" aria-hidden="true"></span>
      {{ label }}
    </span>
  `,
  styles: [':host { display: inline-flex; }'],
})
export class StatusBadgeComponent {
  @Input({ required: true }) label!: string;

  @Input({ required: true }) set tone(value: BadgeTone) {
    this.toneSignal.set(value);
  }

  private readonly toneSignal = signal<BadgeTone>('neutral');

  protected readonly classes = computed(() => {
    switch (this.toneSignal()) {
      case 'success':
        return 'border-success/25 bg-success/10 text-success-text';
      case 'warning':
        return 'border-warning/30 bg-warning/10 text-warning-text';
      case 'danger':
        return 'border-danger/25 bg-danger/10 text-danger-text';
      case 'info':
        return 'border-primary/25 bg-primary/10 text-primary-text';
      default:
        return 'border-border-subtle bg-background text-content-secondary';
    }
  });

  protected readonly dotClass = computed(() => {
    switch (this.toneSignal()) {
      case 'success':
        return 'bg-success';
      case 'warning':
        return 'bg-warning';
      case 'danger':
        return 'bg-danger';
      case 'info':
        return 'bg-primary';
      default:
        return 'bg-content-secondary';
    }
  });
}
