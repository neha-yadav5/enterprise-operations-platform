import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EmployeeService } from '../../core/employee.service';
import { NotificationService } from '../../core/notification.service';
import { Permission } from '../../core/permissions/permission.model';
import { PermissionService } from '../../core/permissions/permission.service';
import { RoleId } from '../../core/permissions/permission.model';
import { CURRENT_USER_ID } from '../../core/session';
import { ThemeId, ThemeService } from '../../core/theme.service';
import { fullName, initials } from '../../models/employee.model';
import { NOTIFICATION_ICONS, AppNotification } from '../../models/notification.model';
import { IconComponent, IconName } from '../../shared/icon/icon.component';

@Component({
  selector: 'nx-topbar',
  standalone: true,
  imports: [RouterLink, DatePipe, IconComponent],
  templateUrl: './topbar.component.html',
  styles: [':host { display: block; }'],
})
export class TopbarComponent {
  private readonly notificationService = inject(NotificationService);
  private readonly employees = inject(EmployeeService);

  /** Always the authenticated user — never an id from the URL. */
  private readonly me = computed(() => this.employees.byId(CURRENT_USER_ID));

  readonly initials = computed(() => {
    const me = this.me();
    return me ? initials(me) : '—';
  });

  readonly displayName = computed(() => {
    const me = this.me();
    return me ? fullName(me) : 'Account';
  });

  readonly roleLabel = computed(() => this.me()?.title ?? '');

  readonly unreadCount = this.notificationService.unreadCount;
  readonly recent = this.notificationService.recent;

  private readonly themeService = inject(ThemeService);

  readonly themes = this.themeService.themes;
  readonly activeTheme = this.themeService.theme;

  /** Which dropdown is open, or null. Only one may be open at a time. */
  readonly openPanel = signal<'notifications' | 'quickAction' | 'account' | 'theme' | null>(null);

  readonly notificationsOpen = computed(() => this.openPanel() === 'notifications');
  readonly quickActionOpen = computed(() => this.openPanel() === 'quickAction');
  readonly accountOpen = computed(() => this.openPanel() === 'account');
  readonly themeOpen = computed(() => this.openPanel() === 'theme');

  setTheme(id: ThemeId): void {
    this.themeService.set(id);
  }

  private readonly permissions = inject(PermissionService);

  readonly roles = this.permissions.roles;
  readonly currentRoleId = this.permissions.currentRoleId;
  readonly roleName = computed(() => this.permissions.role().name);
  readonly roleScope = computed(() => this.permissions.role().scope);

  switchRole(id: RoleId): void {
    this.permissions.switchTo(id);
    this.close();
  }

  private readonly allQuickActions: {
    label: string;
    icon: IconName;
    link: string;
    permission: Permission;
  }[] = [
    { label: 'Add employee', icon: 'user-plus', link: '/employees/new', permission: 'employees.create' },
    { label: 'Create project', icon: 'folder', link: '/projects/new', permission: 'projects.create' },
    { label: 'Raise request', icon: 'inbox', link: '/requests/new', permission: 'requests.create' },
    { label: 'Register asset', icon: 'laptop', link: '/assets/new', permission: 'assets.create' },
    {
      label: 'New department',
      icon: 'building',
      link: '/departments/new',
      permission: 'departments.create',
    },
  ];

  /** An empty list means the button itself is hidden, not a menu of nothing. */
  readonly quickActions = computed(() =>
    this.allQuickActions.filter((action) => this.permissions.has(action.permission)),
  );

  iconFor(notification: AppNotification): IconName {
    return NOTIFICATION_ICONS[notification.kind];
  }

  toggle(panel: 'notifications' | 'quickAction' | 'account' | 'theme'): void {
    this.openPanel.update((current) => (current === panel ? null : panel));
  }

  close(): void {
    this.openPanel.set(null);
  }

  markAllRead(): void {
    this.notificationService.markAllRead();
  }

  openNotification(notification: AppNotification): void {
    this.notificationService.markRead(notification.id);
    this.close();
  }
}
