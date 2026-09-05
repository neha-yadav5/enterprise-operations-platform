import { Routes } from '@angular/router';

import { permissionGuard } from './core/permissions/permission.guard';
import { ShellComponent } from './layout/shell/shell.component';

/**
 * Every route that needs a permission declares it in `data.permission` and
 * runs `permissionGuard`. Hiding the sidebar entry is not enough — a typed URL
 * has to be answered too, and it is, with /403 rather than a silent redirect.
 *
 * `new` is declared before `:id` throughout: the router matches in order, so
 * the literal segment must win before the parameter does.
 */
export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },

      // ---------------------------------------------------------- Employees
      {
        path: 'employees',
        title: 'Employees',
        canActivate: [permissionGuard],
        data: { permission: 'employees.view' },
        loadComponent: () =>
          import('./features/employees/employees.component').then((m) => m.EmployeesComponent),
      },
      {
        path: 'employees/new',
        title: 'Add employee',
        canActivate: [permissionGuard],
        data: { permission: 'employees.create' },
        loadComponent: () =>
          import('./features/employees/employee-form.component').then(
            (m) => m.EmployeeFormComponent,
          ),
      },
      {
        path: 'employees/:id/edit',
        title: 'Edit employee',
        canActivate: [permissionGuard],
        data: { permission: 'employees.edit' },
        loadComponent: () =>
          import('./features/employees/employee-form.component').then(
            (m) => m.EmployeeFormComponent,
          ),
      },
      {
        path: 'employees/:id',
        title: 'Employee',
        canActivate: [permissionGuard],
        data: { permission: 'employees.view' },
        loadComponent: () =>
          import('./features/employees/employee-detail.component').then(
            (m) => m.EmployeeDetailComponent,
          ),
      },

      // ----------------------------------------------------------- Projects
      {
        path: 'projects',
        title: 'Projects',
        canActivate: [permissionGuard],
        data: { permission: 'projects.view' },
        loadComponent: () =>
          import('./features/projects/projects.component').then((m) => m.ProjectsComponent),
      },
      {
        path: 'projects/new',
        title: 'New project',
        canActivate: [permissionGuard],
        data: { permission: 'projects.create' },
        loadComponent: () =>
          import('./features/projects/project-form.component').then((m) => m.ProjectFormComponent),
      },
      {
        path: 'projects/:id/edit',
        title: 'Edit project',
        canActivate: [permissionGuard],
        data: { permission: 'projects.edit' },
        loadComponent: () =>
          import('./features/projects/project-form.component').then((m) => m.ProjectFormComponent),
      },
      {
        path: 'projects/:id',
        title: 'Project',
        canActivate: [permissionGuard],
        data: { permission: 'projects.view' },
        loadComponent: () =>
          import('./features/projects/project-detail.component').then(
            (m) => m.ProjectDetailComponent,
          ),
      },

      // ----------------------------------------------------------- Requests
      {
        path: 'requests',
        title: 'Requests',
        canActivate: [permissionGuard],
        data: { permission: 'requests.view' },
        loadComponent: () =>
          import('./features/requests/requests.component').then((m) => m.RequestsComponent),
      },
      {
        path: 'requests/new',
        title: 'Raise request',
        canActivate: [permissionGuard],
        data: { permission: 'requests.create' },
        loadComponent: () =>
          import('./features/requests/request-form.component').then((m) => m.RequestFormComponent),
      },
      {
        path: 'requests/:id',
        title: 'Request',
        canActivate: [permissionGuard],
        data: { permission: 'requests.view' },
        loadComponent: () =>
          import('./features/requests/request-detail.component').then(
            (m) => m.RequestDetailComponent,
          ),
      },

      // -------------------------------------------------------- Departments
      {
        path: 'departments',
        title: 'Departments',
        canActivate: [permissionGuard],
        data: { permission: 'departments.view' },
        loadComponent: () =>
          import('./features/departments/departments.component').then(
            (m) => m.DepartmentsComponent,
          ),
      },
      {
        path: 'departments/new',
        title: 'New department',
        canActivate: [permissionGuard],
        data: { permission: 'departments.create' },
        loadComponent: () =>
          import('./features/departments/department-form.component').then(
            (m) => m.DepartmentFormComponent,
          ),
      },
      {
        path: 'departments/:id/edit',
        title: 'Edit department',
        canActivate: [permissionGuard],
        data: { permission: 'departments.edit' },
        loadComponent: () =>
          import('./features/departments/department-form.component').then(
            (m) => m.DepartmentFormComponent,
          ),
      },
      {
        path: 'departments/:id',
        title: 'Department',
        canActivate: [permissionGuard],
        data: { permission: 'departments.view' },
        loadComponent: () =>
          import('./features/departments/department-detail.component').then(
            (m) => m.DepartmentDetailComponent,
          ),
      },

      // ----------------------------------------------------------- Workflow
      {
        path: 'workflow',
        title: 'Workflow',
        canActivate: [permissionGuard],
        data: { permission: 'workflows.view' },
        loadComponent: () =>
          import('./features/workflow/workflow.component').then((m) => m.WorkflowComponent),
      },
      {
        path: 'workflow/:id',
        title: 'Workflow builder',
        canActivate: [permissionGuard],
        data: { permission: 'workflows.view' },
        loadComponent: () =>
          import('./features/workflow/workflow-builder.component').then(
            (m) => m.WorkflowBuilderComponent,
          ),
      },

      // ------------------------------------------------------------- Assets
      {
        path: 'assets',
        title: 'Assets',
        canActivate: [permissionGuard],
        data: { permission: 'assets.view' },
        loadComponent: () =>
          import('./features/assets/assets.component').then((m) => m.AssetsComponent),
      },
      {
        path: 'assets/new',
        title: 'Register asset',
        canActivate: [permissionGuard],
        data: { permission: 'assets.create' },
        loadComponent: () =>
          import('./features/assets/asset-form.component').then((m) => m.AssetFormComponent),
      },
      {
        path: 'assets/:id/edit',
        title: 'Edit asset',
        canActivate: [permissionGuard],
        data: { permission: 'assets.edit' },
        loadComponent: () =>
          import('./features/assets/asset-form.component').then((m) => m.AssetFormComponent),
      },
      {
        path: 'assets/:id',
        title: 'Asset',
        canActivate: [permissionGuard],
        data: { permission: 'assets.view' },
        loadComponent: () =>
          import('./features/assets/asset-detail.component').then((m) => m.AssetDetailComponent),
      },

      // ---------------------------------------------------------- Documents
      {
        path: 'documents',
        title: 'Documents',
        canActivate: [permissionGuard],
        data: { permission: 'documents.view' },
        loadComponent: () =>
          import('./features/documents/documents.component').then((m) => m.DocumentsComponent),
      },
      {
        path: 'documents/new',
        title: 'Upload document',
        canActivate: [permissionGuard],
        data: { permission: 'documents.upload' },
        loadComponent: () =>
          import('./features/documents/document-form.component').then(
            (m) => m.DocumentFormComponent,
          ),
      },
      {
        path: 'documents/:id',
        title: 'Document',
        canActivate: [permissionGuard],
        data: { permission: 'documents.view' },
        loadComponent: () =>
          import('./features/documents/document-detail.component').then(
            (m) => m.DocumentDetailComponent,
          ),
      },

      // ----------------------------------------------------------- Insights
      {
        path: 'reports',
        title: 'Reports',
        canActivate: [permissionGuard],
        data: { permission: 'reports.view' },
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'reports/:id',
        title: 'Report',
        canActivate: [permissionGuard],
        data: { permission: 'reports.view' },
        loadComponent: () =>
          import('./features/reports/report-detail.component').then((m) => m.ReportDetailComponent),
      },
      {
        path: 'analytics',
        title: 'Analytics',
        canActivate: [permissionGuard],
        data: { permission: 'analytics.view' },
        loadComponent: () =>
          import('./features/analytics/analytics.component').then((m) => m.AnalyticsComponent),
      },

      // ----------------------------------------------------- Administration
      {
        path: 'settings',
        title: 'Settings',
        canActivate: [permissionGuard],
        data: { permission: 'settings.view' },
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'roles',
        title: 'Roles',
        canActivate: [permissionGuard],
        data: { permission: 'roles.view', tab: 'roles' },
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'audit-logs',
        title: 'Audit Logs',
        canActivate: [permissionGuard],
        data: { permission: 'audit.view' },
        loadComponent: () =>
          import('./features/audit-logs/audit-logs.component').then((m) => m.AuditLogsComponent),
      },

      // ------------------------------------------------------------ Account
      {
        path: 'profile',
        title: 'My Profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'notifications',
        title: 'Notifications',
        loadComponent: () =>
          import('./features/notifications/notifications.component').then(
            (m) => m.NotificationsComponent,
          ),
      },

      {
        path: 'style-guide',
        title: 'Design System',
        loadComponent: () =>
          import('./features/style-guide/style-guide.component').then((m) => m.StyleGuideComponent),
      },
      {
        path: '403',
        title: 'Access restricted',
        loadComponent: () =>
          import('./features/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
      },

      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
