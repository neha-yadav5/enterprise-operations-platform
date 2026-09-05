import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { IconComponent } from '../../shared/icon/icon.component';

/**
 * Stands in for every module that lands in a later phase, so the shell's
 * navigation is fully walkable now. Title and phase come from route data.
 */
@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="px-4 pb-10 pt-3 sm:px-6">
      <h1 class="nx-h1">{{ vm().title }}</h1>

      <div
        class="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface px-6 py-16 text-center"
      >
        <span
          class="flex h-12 w-12 items-center justify-center rounded-xl bg-background text-content-secondary"
          aria-hidden="true"
        >
          <nx-icon name="folder" [size]="24" />
        </span>

        <h2 class="nx-h3 mt-4">Not built yet</h2>
        <p class="nx-body mt-1 max-w-md text-content-secondary">
          {{ vm().title }} is scheduled for {{ vm().phase }} of the delivery plan. The route,
          navigation entry and breadcrumb are wired up so the shell is walkable today.
        </p>
      </div>
    </div>
  `,
  styles: [':host { display: block; }'],
})
export class PlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly vm = toSignal(
    this.route.data.pipe(
      map((data) => ({
        title: (data['title'] as string) ?? 'Module',
        phase: (data['phase'] as string) ?? 'a later phase',
      })),
    ),
    { initialValue: { title: 'Module', phase: 'a later phase' } },
  );
}
