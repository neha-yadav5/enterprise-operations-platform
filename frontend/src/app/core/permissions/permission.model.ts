/**
 * Frontend permission vocabulary.
 *
 * This is a UI-development model, not a security boundary. Nothing here is
 * enforced — a determined user can flip a signal in devtools and see every
 * screen. Real enforcement belongs behind the API. The value of this layer is
 * that the UI can be built and demoed as a genuine multi-role product before
 * any of that exists.
 */
export type Permission =
  | 'employees.view'
  | 'employees.create'
  | 'employees.edit'
  | 'employees.delete'
  | 'departments.view'
  | 'departments.create'
  | 'departments.edit'
  | 'projects.view'
  | 'projects.create'
  | 'projects.edit'
  | 'projects.archive'
  | 'projects.manage_members'
  | 'requests.view'
  | 'requests.create'
  | 'requests.approve'
  | 'requests.reject'
  | 'workflows.view'
  | 'workflows.create'
  | 'workflows.edit'
  | 'workflows.publish'
  | 'assets.view'
  | 'assets.create'
  | 'assets.edit'
  | 'assets.assign'
  | 'documents.view'
  | 'documents.upload'
  | 'documents.edit'
  | 'documents.share'
  | 'analytics.view'
  | 'reports.view'
  | 'reports.create'
  | 'reports.export'
  | 'settings.view'
  | 'settings.edit'
  | 'roles.view'
  | 'roles.manage'
  | 'audit.view'
  | 'audit.export'
  | 'notifications.view'
  | 'profile.view'
  | 'profile.edit';

export type RoleId =
  | 'super-admin'
  | 'org-admin'
  | 'hr-manager'
  | 'finance-manager'
  | 'dept-manager'
  | 'project-manager'
  | 'employee'
  | 'auditor';

export interface RoleDefinition {
  id: RoleId;
  name: string;
  description: string;
  /** How wide this role's data scope is, shown in the UI as context. */
  scope: 'Organisation' | 'Department' | 'Project' | 'Own records' | 'Read-only';
  permissions: Permission[];
}

/** Grouped for the permission matrix, so the screen has a stable order. */
export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  {
    label: 'Employees',
    permissions: ['employees.view', 'employees.create', 'employees.edit', 'employees.delete'],
  },
  {
    label: 'Departments',
    permissions: ['departments.view', 'departments.create', 'departments.edit'],
  },
  {
    label: 'Projects',
    permissions: [
      'projects.view',
      'projects.create',
      'projects.edit',
      'projects.archive',
      'projects.manage_members',
    ],
  },
  {
    label: 'Requests',
    permissions: ['requests.view', 'requests.create', 'requests.approve', 'requests.reject'],
  },
  {
    label: 'Workflows',
    permissions: ['workflows.view', 'workflows.create', 'workflows.edit', 'workflows.publish'],
  },
  {
    label: 'Assets',
    permissions: ['assets.view', 'assets.create', 'assets.edit', 'assets.assign'],
  },
  {
    label: 'Documents',
    permissions: ['documents.view', 'documents.upload', 'documents.edit', 'documents.share'],
  },
  {
    label: 'Insights',
    permissions: ['analytics.view', 'reports.view', 'reports.create', 'reports.export'],
  },
  {
    label: 'Administration',
    permissions: [
      'settings.view',
      'settings.edit',
      'roles.view',
      'roles.manage',
      'audit.view',
      'audit.export',
    ],
  },
  {
    label: 'Account',
    permissions: ['notifications.view', 'profile.view', 'profile.edit'],
  },
];

/** "employees.create" -> "Create". The group heading carries the noun. */
export function permissionVerb(permission: Permission): string {
  const verb = permission.split('.')[1] ?? permission;
  const words = verb.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
