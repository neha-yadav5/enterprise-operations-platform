import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';

import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { NAV_GROUP_BY_ROUTE, NAV_LABEL_BY_ROUTE } from '../../core/navigation';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'nx-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './shell.component.html',
  styles: [':host { display: block; height: 100%; }'],
})
export class ShellComponent {
  private readonly router = inject(Router);

  readonly collapsed = signal(false);

  /**
   * Seeded with `router.url` so the first server render produces the same
   * breadcrumb the client hydrates with — NavigationEnd has already fired by
   * the time this component exists.
   */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  private readonly settings = inject(SettingsService);

  readonly crumbs = computed<string[]>(() => {
    // The trail is rooted in the organisation name, not a hard-coded brand,
    // so renaming the org in Settings updates it everywhere at once.
    const org = this.settings.organisation().name;
    const top = '/' + (this.url().split(/[?#]/)[0].split('/')[1] ?? '');
    const label = NAV_LABEL_BY_ROUTE[top];
    const group = NAV_GROUP_BY_ROUTE[top];
    return label ? [org, group, label] : [org];
  });

  toggleSidebar(): void {
    this.collapsed.update((value) => !value);
  }
}
