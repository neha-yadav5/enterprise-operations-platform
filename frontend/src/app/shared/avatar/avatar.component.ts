import { Component, Input } from '@angular/core';

/**
 * Initials avatar.
 *
 * Deliberately one non-status colour rather than a hash-picked hue: the status
 * palette (success / warning / danger) is reserved, and tinting avatars from a
 * similar range makes people read identity as state.
 */
@Component({
  selector: 'nx-avatar',
  standalone: true,
  template: `
    <span
      class="inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary-text"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.fontSize.px]="fontSize"
      aria-hidden="true"
    >
      {{ initials }}
    </span>
  `,
  styles: [':host { display: inline-flex; }'],
})
export class AvatarComponent {
  @Input({ required: true }) initials!: string;
  @Input() size = 36;

  get fontSize(): number {
    return Math.max(11, Math.round(this.size * 0.36));
  }
}
