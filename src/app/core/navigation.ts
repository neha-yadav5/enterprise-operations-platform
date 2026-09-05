import { IconName } from '../shared/icon/icon.component';
import { Permission } from './permissions/permission.model';

export interface NavItem {
  label: string;
  route: string;
  icon: IconName;
  /** Rendered as a count pill on the right of the row. */
  badge?: number;
  /**
   * Permission required to see this entry. Omitted means always visible —
   * used for Dashboard, which every authenticated role can reach.
   */
  permission?: Permission;
}

export interface NavGroup {
  /** Section heading; matches the small caps labels in the reference design. */
  title: string;
  items: NavItem[];
}

/**
 * Sidebar information architecture — spec section 4.
 *
 * Administration's Settings / Roles / Audit Logs are listed here so the shell
 * renders the full IA, even though those screens land in later phases.
 */
export const NAVIGATION: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', route: '/dashboard', icon: 'grid' }],
  },
  {
    title: 'Workspace',
    items: [
      { label: 'Employees', route: '/employees', icon: 'users', permission: 'employees.view' },
      {
        label: 'Departments',
        route: '/departments',
        icon: 'building',
        permission: 'departments.view',
      },
      { label: 'Projects', route: '/projects', icon: 'folder', permission: 'projects.view' },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        label: 'Requests',
        route: '/requests',
        icon: 'inbox',
        badge: 23,
        permission: 'requests.view',
      },
      { label: 'Workflow', route: '/workflow', icon: 'workflow', permission: 'workflows.view' },
      { label: 'Assets', route: '/assets', icon: 'laptop', permission: 'assets.view' },
      { label: 'Documents', route: '/documents', icon: 'document', permission: 'documents.view' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Reports', route: '/reports', icon: 'bar-chart', permission: 'reports.view' },
      { label: 'Analytics', route: '/analytics', icon: 'line-chart', permission: 'analytics.view' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Settings', route: '/settings', icon: 'sliders', permission: 'settings.view' },
      { label: 'Roles', route: '/roles', icon: 'shield', permission: 'roles.view' },
      { label: 'Audit Logs', route: '/audit-logs', icon: 'audit', permission: 'audit.view' },
    ],
  },
];

/** Flat lookup used by the breadcrumb trail. */
export const NAV_LABEL_BY_ROUTE: Record<string, string> = NAVIGATION.reduce(
  (acc, group) => {
    for (const item of group.items) {
      acc[item.route] = item.label;
    }
    return acc;
  },
  {} as Record<string, string>,
);

export const NAV_GROUP_BY_ROUTE: Record<string, string> = NAVIGATION.reduce(
  (acc, group) => {
    for (const item of group.items) {
      acc[item.route] = group.title;
    }
    return acc;
  },
  {} as Record<string, string>,
);
