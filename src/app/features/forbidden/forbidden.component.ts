import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PermissionService } from '../../core/permissions/permission.service';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <div class="px-4 pb-10 pt-3 sm:px-6">
      <div
        class="flex flex-col items-center justify-center rounded-lg border border-border-subtle bg-surface px-6 py-20 text-center"
      >
        <span
          class="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning-text"
          aria-hidden="true"
        >
          <nx-icon name="shield" [size]="24" />
        </span>

        <h1 class="nx-h2 mt-4">Access restricted</h1>
        <p class="nx-body mt-1 max-w-md text-content-secondary">
          You don't have permission to access this page as
          <strong>{{ role().name }}</strong
          >.
          @if (from()) {
            The route was <span class="font-mono">/{{ from() }}</span
            >.
          }
        </p>
        <p class="nx-caption mt-3 max-w-md">
          Switch role from the account menu to see it with different permissions.
        </p>

        <a
          routerLink="/dashboard"
          class="nx-button-text mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-white transition-colors hover:bg-primary-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <nx-icon name="arrow-left" [size]="18" />
          Go to Dashboard
        </a>
      </div>
    </div>
  `,
  styles: [':host { display: block; }'],
})
export class ForbiddenComponent {
  private readonly route = inject(ActivatedRoute);

  readonly role = inject(PermissionService).role;

  readonly from = () => this.route.snapshot.queryParamMap.get('from') ?? '';
}
