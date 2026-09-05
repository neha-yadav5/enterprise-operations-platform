import { Component, Input, computed, inject, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../../shared/icon/icon.component';
import { NAVIGATION, NavGroup, NavItem } from '../../core/navigation';
import { PermissionService } from '../../core/permissions/permission.service';
import { RequestService } from '../../core/request.service';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'nx-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Input() collapsed = false;

  readonly toggle = output<void>();

  private readonly permissions = inject(PermissionService);

  /**
   * Navigation is generated from permissions, not role names — so a new role
   * is a data change in roles.data.ts and the sidebar follows. Groups left
   * with no visible entries are dropped, rather than rendering a bare heading.
   */
  readonly groups = computed<NavGroup[]>(() =>
    NAVIGATION.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || this.permissions.has(item.permission),
      ),
    })).filter((group) => group.items.length > 0),
  );

  readonly roleName = computed(() => this.permissions.role().name);

  /** Brand follows the organisation record, editable in Settings. */
  private readonly settings = inject(SettingsService);
  readonly orgName = computed(() => this.settings.organisation().name);
  readonly logo = this.settings.logo;

  readonly currentUser = {
    name: 'Elena Duarte',
    role: 'Company Admin',
    initials: 'ED',
  };

  private readonly requestService = inject(RequestService);

  /**
   * Requests shows the live pending count rather than the static badge in the
   * navigation data, so approving something on the detail screen updates the
   * sidebar immediately.
   */
  badgeFor(item: NavItem): number | undefined {
    if (item.route === '/requests') {
      return this.requestService.pendingCount() || undefined;
    }
    return item.badge;
  }
}
