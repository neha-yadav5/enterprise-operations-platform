import { Injectable, computed, signal } from '@angular/core';

import { AuditEvent } from '../models/audit.model';

/**
 * Append-only audit store.
 *
 * The PRD requires server-side pagination, filtering and sorting; there is no
 * server, so this filters and pages in memory over a fixed fixture set. The
 * shape of the query — `AuditQuery` below — deliberately mirrors the documented
 * API parameters so swapping this for an HTTP call touches only this class.
 *
 * There is intentionally no update or delete method. Audit records are
 * append-only from the application's point of view, so the store exposes no way
 * to change one.
 */
export interface AuditQuery {
  search: string;
  actorId: string;
  action: string;
  entityType: string;
  module: string;
  result: string;
  severity: string;
  page: number;
  size: number;
}

export interface AuditPage {
  rows: AuditEvent[];
  total: number;
  page: number;
  pages: number;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly store = signal<AuditEvent[]>(SEED);

  readonly events = this.store.asReadonly();
  readonly total = computed(() => this.store().length);

  /** Distinct action verbs present, for the filter menu. */
  readonly actions = computed(() =>
    [...new Set(this.store().map((event) => event.action))].sort(),
  );

  readonly actorIds = computed(() =>
    [...new Set(this.store().map((event) => event.actorId))].sort(),
  );

  byId(id: string): AuditEvent | undefined {
    return this.store().find((event) => event.id === id);
  }

  query(query: AuditQuery): AuditPage {
    const needle = query.search.trim().toLowerCase();

    const matched = this.store().filter((event) => {
      if (query.actorId && event.actorId !== query.actorId) return false;
      if (query.action && event.action !== query.action) return false;
      if (query.entityType && event.entityType !== query.entityType) return false;
      if (query.module && event.module !== query.module) return false;
      if (query.result && event.result !== query.result) return false;
      if (query.severity && event.severity !== query.severity) return false;
      if (!needle) return true;

      return [event.id, event.action, event.entityId, event.entityName, event.correlationId]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });

    const pages = Math.max(1, Math.ceil(matched.length / query.size));
    const page = Math.min(Math.max(1, query.page), pages);
    const start = (page - 1) * query.size;

    return {
      rows: matched.slice(start, start + query.size),
      total: matched.length,
      page,
      pages,
    };
  }
}

const SEED: AuditEvent[] = [
  {
    id: 'AUD-928381',
    timestamp: '2026-09-05T09:30:00Z',
    actorId: 'EMP-1008',
    action: 'REQUEST_APPROVED',
    entityType: 'REQUEST',
    entityId: 'REQ-4818',
    entityName: 'Additional load-testing licences',
    result: 'Success',
    severity: 'Info',
    module: 'Requests',
    ip: '10.4.18.22',
    correlationId: 'CORR-48291',
    changes: [
      { field: 'status', before: 'PENDING', after: 'APPROVED' },
      { field: 'currentStep', before: 'Manager review', after: 'Finance approval' },
    ],
    link: ['/requests', 'REQ-4818'],
  },
  {
    id: 'AUD-928374',
    timestamp: '2026-09-05T08:58:00Z',
    actorId: 'EMP-1063',
    action: 'LOGIN_FAILURE',
    entityType: 'SESSION',
    entityId: 'SES-77120',
    entityName: 'sofia.bianchi@nexusone.io',
    result: 'Failure',
    severity: 'Warning',
    module: 'Security',
    ip: '81.44.90.7',
    correlationId: 'CORR-48277',
    changes: [],
    link: null,
  },
  {
    id: 'AUD-928360',
    timestamp: '2026-09-05T08:41:00Z',
    actorId: 'EMP-1001',
    action: 'ROLE_PERMISSION_CHANGED',
    entityType: 'ROLE',
    entityId: 'it-admin',
    entityName: 'IT Admin',
    result: 'Success',
    severity: 'Notice',
    module: 'Administration',
    ip: '10.4.18.3',
    correlationId: 'CORR-48260',
    changes: [{ field: 'permissions.Settings', before: 'false', after: 'true' }],
    link: ['/roles'],
  },
  {
    id: 'AUD-928344',
    timestamp: '2026-09-05T08:12:00Z',
    actorId: 'EMP-1052',
    action: 'DOCUMENT_UPLOADED',
    entityType: 'DOCUMENT',
    entityId: 'DOC-3341',
    entityName: 'Payroll Migration Runbook',
    result: 'Success',
    severity: 'Info',
    module: 'Documents',
    ip: '10.9.2.51',
    correlationId: 'CORR-48244',
    changes: [{ field: 'version', before: 'v2.2', after: 'v2.3' }],
    link: ['/documents', 'DOC-3341'],
  },
  {
    id: 'AUD-928331',
    timestamp: '2026-09-04T17:20:00Z',
    actorId: 'EMP-1094',
    action: 'AUDIT_EXPORT_REQUESTED',
    entityType: 'SETTING',
    entityId: 'EXPORT-2214',
    entityName: 'Audit export — August',
    result: 'Denied',
    severity: 'Warning',
    module: 'Administration',
    ip: '10.4.19.88',
    correlationId: 'CORR-48231',
    changes: [],
    link: null,
  },
  {
    id: 'AUD-928319',
    timestamp: '2026-09-04T16:02:00Z',
    actorId: 'EMP-1015',
    action: 'EMPLOYEE_CREATED',
    entityType: 'EMPLOYEE',
    entityId: 'EMP-1118',
    entityName: 'Kofi Mensah',
    result: 'Success',
    severity: 'Info',
    module: 'Employees',
    ip: '10.7.3.14',
    correlationId: 'CORR-48219',
    changes: [
      { field: 'status', before: '—', after: 'Active' },
      { field: 'employmentType', before: '—', after: 'Intern' },
    ],
    link: ['/employees', 'EMP-1118'],
  },
  {
    id: 'AUD-928302',
    timestamp: '2026-09-04T14:44:00Z',
    actorId: 'EMP-1001',
    action: 'WORKFLOW_PUBLISHED',
    entityType: 'WORKFLOW',
    entityId: 'WFL-14',
    entityName: 'Promotion review',
    result: 'Success',
    severity: 'Notice',
    module: 'Workflow',
    ip: '10.4.18.3',
    correlationId: 'CORR-48202',
    changes: [
      { field: 'status', before: 'Draft', after: 'Active' },
      { field: 'version', before: '1', after: '2' },
    ],
    link: ['/workflow', 'WFL-14'],
  },
  {
    id: 'AUD-928288',
    timestamp: '2026-09-04T11:30:00Z',
    actorId: 'EMP-1063',
    action: 'ASSET_ASSIGNED',
    entityType: 'ASSET',
    entityId: 'AST-8840',
    entityName: 'MacBook Air M2',
    result: 'Success',
    severity: 'Info',
    module: 'Assets',
    ip: '10.6.1.77',
    correlationId: 'CORR-48188',
    changes: [
      { field: 'status', before: 'Available', after: 'Assigned' },
      { field: 'assignee', before: 'Unassigned', after: 'Kofi Mensah' },
    ],
    link: ['/assets', 'AST-8840'],
  },
  {
    id: 'AUD-928270',
    timestamp: '2026-09-04T09:15:00Z',
    actorId: 'EMP-1031',
    action: 'REQUEST_REJECTED',
    entityType: 'REQUEST',
    entityId: 'REQ-4790',
    entityName: 'Promotion review — Senior to Staff',
    result: 'Success',
    severity: 'Notice',
    module: 'Requests',
    ip: '10.5.7.31',
    correlationId: 'CORR-48170',
    changes: [{ field: 'status', before: 'PENDING', after: 'REJECTED' }],
    link: ['/requests', 'REQ-4790'],
  },
  {
    id: 'AUD-928255',
    timestamp: '2026-09-03T18:42:00Z',
    actorId: 'EMP-1001',
    action: 'ORGANIZATION_SETTINGS_CHANGED',
    entityType: 'SETTING',
    entityId: 'ORG-0001',
    entityName: 'NexusOne',
    result: 'Success',
    severity: 'Notice',
    module: 'Administration',
    ip: '10.4.18.3',
    correlationId: 'CORR-48155',
    changes: [{ field: 'sessionTimeoutMinutes', before: '240', after: '60' }],
    link: ['/settings'],
  },
  {
    id: 'AUD-928241',
    timestamp: '2026-09-03T15:05:00Z',
    actorId: 'EMP-1008',
    action: 'PROJECT_UPDATED',
    entityType: 'PROJECT',
    entityId: 'PRJ-201',
    entityName: 'Payroll Migration',
    result: 'Success',
    severity: 'Warning',
    module: 'Projects',
    ip: '10.4.18.22',
    correlationId: 'CORR-48141',
    changes: [
      { field: 'status', before: 'On track', after: 'At risk' },
      { field: 'progress', before: '68', after: '72' },
    ],
    link: ['/projects', 'PRJ-201'],
  },
  {
    id: 'AUD-928227',
    timestamp: '2026-09-03T10:20:00Z',
    actorId: 'EMP-1080',
    action: 'LOGIN_SUCCESS',
    entityType: 'SESSION',
    entityId: 'SES-77004',
    entityName: 'sarah.mensah@nexusone.io',
    result: 'Success',
    severity: 'Info',
    module: 'Security',
    ip: '41.58.120.9',
    correlationId: 'CORR-48127',
    changes: [],
    link: null,
  },
  {
    id: 'AUD-928210',
    timestamp: '2026-09-02T16:35:00Z',
    actorId: 'EMP-1015',
    action: 'DOCUMENT_PERMISSION_CHANGED',
    entityType: 'DOCUMENT',
    entityId: 'DOC-3301',
    entityName: 'Employee Handbook 2026',
    result: 'Success',
    severity: 'Notice',
    module: 'Documents',
    ip: '10.7.3.14',
    correlationId: 'CORR-48110',
    changes: [{ field: 'access', before: 'Department', after: 'Everyone' }],
    link: ['/documents', 'DOC-3301'],
  },
  {
    id: 'AUD-928198',
    timestamp: '2026-09-02T13:48:00Z',
    actorId: 'EMP-1023',
    action: 'REQUEST_CREATED',
    entityType: 'REQUEST',
    entityId: 'REQ-4803',
    entityName: 'Replacement laptop — battery failure',
    result: 'Success',
    severity: 'Info',
    module: 'Requests',
    ip: '10.8.4.19',
    correlationId: 'CORR-48098',
    changes: [{ field: 'status', before: '—', after: 'PENDING' }],
    link: ['/requests', 'REQ-4803'],
  },
  {
    id: 'AUD-928180',
    timestamp: '2026-09-02T09:02:00Z',
    actorId: 'EMP-1071',
    action: 'ASSET_MAINTENANCE_CHANGED',
    entityType: 'ASSET',
    entityId: 'AST-8807',
    entityName: 'ThinkPad X1 Carbon',
    result: 'Success',
    severity: 'Info',
    module: 'Assets',
    ip: '92.14.7.201',
    correlationId: 'CORR-48080',
    changes: [{ field: 'status', before: 'Assigned', after: 'In repair' }],
    link: ['/assets', 'AST-8807'],
  },
  {
    id: 'AUD-928166',
    timestamp: '2026-09-01T17:11:00Z',
    actorId: 'EMP-1044',
    action: 'PROJECT_CREATED',
    entityType: 'PROJECT',
    entityId: 'PRJ-225',
    entityName: 'Workspace Relocation — Berlin',
    result: 'Success',
    severity: 'Info',
    module: 'Projects',
    ip: '10.4.20.6',
    correlationId: 'CORR-48066',
    changes: [{ field: 'status', before: '—', after: 'On track' }],
    link: ['/projects', 'PRJ-225'],
  },
  {
    id: 'AUD-928150',
    timestamp: '2026-09-01T12:26:00Z',
    actorId: 'EMP-1063',
    action: 'API_KEY_REVOKED',
    entityType: 'SETTING',
    entityId: 'KEY-0092',
    entityName: 'Reporting warehouse extract key',
    result: 'Success',
    severity: 'Critical',
    module: 'Security',
    ip: '10.6.1.77',
    correlationId: 'CORR-48050',
    changes: [{ field: 'state', before: 'Active', after: 'Revoked' }],
    link: null,
  },
  {
    id: 'AUD-928133',
    timestamp: '2026-08-31T15:40:00Z',
    actorId: 'EMP-1121',
    action: 'EMPLOYEE_DEACTIVATED',
    entityType: 'EMPLOYEE',
    entityId: 'EMP-1121',
    entityName: 'Hannah Berg',
    result: 'Success',
    severity: 'Notice',
    module: 'Employees',
    ip: '10.7.3.55',
    correlationId: 'CORR-48033',
    changes: [{ field: 'status', before: 'Active', after: 'Inactive' }],
    link: ['/employees', 'EMP-1121'],
  },
  {
    id: 'AUD-928119',
    timestamp: '2026-08-31T10:04:00Z',
    actorId: 'EMP-1052',
    action: 'PERMISSION_DENIED',
    entityType: 'SETTING',
    entityId: 'ORG-0001',
    entityName: 'Organisation settings',
    result: 'Denied',
    severity: 'Warning',
    module: 'Administration',
    ip: '10.9.2.51',
    correlationId: 'CORR-48019',
    changes: [],
    link: null,
  },
  {
    id: 'AUD-928101',
    timestamp: '2026-08-30T17:05:00Z',
    actorId: 'EMP-1094',
    action: 'DOCUMENT_UPLOADED',
    entityType: 'DOCUMENT',
    entityId: 'DOC-3330',
    entityName: 'FY26 Budget Model',
    result: 'Success',
    severity: 'Info',
    module: 'Documents',
    ip: '10.4.19.88',
    correlationId: 'CORR-48001',
    changes: [{ field: 'version', before: 'v5', after: 'v6' }],
    link: ['/documents', 'DOC-3330'],
  },
  {
    id: 'AUD-928090',
    timestamp: '2026-08-30T09:30:00Z',
    actorId: 'EMP-1008',
    action: 'WORKFLOW_UPDATED',
    entityType: 'WORKFLOW',
    entityId: 'WFL-12',
    entityName: 'Purchase approval',
    result: 'Success',
    severity: 'Info',
    module: 'Workflow',
    ip: '10.4.18.22',
    correlationId: 'CORR-47990',
    changes: [{ field: 'steps[2].slaHours', before: '24', after: '48' }],
    link: ['/workflow', 'WFL-12'],
  },
  {
    id: 'AUD-928077',
    timestamp: '2026-08-29T14:12:00Z',
    actorId: 'EMP-1031',
    action: 'REQUEST_APPROVED',
    entityType: 'REQUEST',
    entityId: 'REQ-4812',
    entityName: 'Berlin office visit — relocation planning',
    result: 'Success',
    severity: 'Info',
    module: 'Requests',
    ip: '10.5.7.31',
    correlationId: 'CORR-47977',
    changes: [{ field: 'status', before: 'PENDING', after: 'APPROVED' }],
    link: ['/requests', 'REQ-4812'],
  },
  {
    id: 'AUD-928061',
    timestamp: '2026-08-28T16:30:00Z',
    actorId: 'EMP-1015',
    action: 'WORKFLOW_CREATED',
    entityType: 'WORKFLOW',
    entityId: 'WFL-14',
    entityName: 'Promotion review',
    result: 'Success',
    severity: 'Info',
    module: 'Workflow',
    ip: '10.7.3.14',
    correlationId: 'CORR-47961',
    changes: [{ field: 'status', before: '—', after: 'Draft' }],
    link: ['/workflow', 'WFL-14'],
  },
  {
    id: 'AUD-928044',
    timestamp: '2026-08-28T08:20:00Z',
    actorId: 'EMP-1080',
    action: 'ASSET_REGISTERED',
    entityType: 'ASSET',
    entityId: 'AST-8845',
    entityName: 'Jabra Evolve2 65',
    result: 'Success',
    severity: 'Info',
    module: 'Assets',
    ip: '41.58.120.9',
    correlationId: 'CORR-47944',
    changes: [{ field: 'status', before: '—', after: 'Assigned' }],
    link: ['/assets', 'AST-8845'],
  },
  {
    id: 'AUD-928030',
    timestamp: '2026-08-27T11:55:00Z',
    actorId: 'EMP-1001',
    action: 'LOGIN_SUCCESS',
    entityType: 'SESSION',
    entityId: 'SES-76880',
    entityName: 'elena.duarte@nexusone.io',
    result: 'Success',
    severity: 'Info',
    module: 'Security',
    ip: '10.4.18.3',
    correlationId: 'CORR-47930',
    changes: [],
    link: null,
  },
  {
    id: 'AUD-928014',
    timestamp: '2026-08-26T15:18:00Z',
    actorId: 'EMP-1044',
    action: 'PROJECT_PERMISSIONS_CHANGED',
    entityType: 'PROJECT',
    entityId: 'PRJ-212',
    entityName: 'Vendor Consolidation',
    result: 'Success',
    severity: 'Notice',
    module: 'Projects',
    ip: '10.4.20.6',
    correlationId: 'CORR-47914',
    changes: [{ field: 'visibility', before: 'Department', after: 'Restricted' }],
    link: ['/projects', 'PRJ-212'],
  },
  {
    id: 'AUD-928001',
    timestamp: '2026-08-26T09:45:00Z',
    actorId: 'EMP-1023',
    action: 'EMPLOYEE_UPDATED',
    entityType: 'EMPLOYEE',
    entityId: 'EMP-1102',
    entityName: 'Ines Almeida',
    result: 'Success',
    severity: 'Info',
    module: 'Employees',
    ip: '10.8.4.19',
    correlationId: 'CORR-47901',
    changes: [
      { field: 'employmentType', before: 'Full-time', after: 'Part-time' },
      { field: 'location', before: 'Berlin', after: 'Remote' },
    ],
    link: ['/employees', 'EMP-1102'],
  },
  {
    id: 'AUD-927988',
    timestamp: '2026-08-25T13:02:00Z',
    actorId: 'EMP-1063',
    action: 'SECURITY_CONFIG_CHANGED',
    entityType: 'SETTING',
    entityId: 'SEC-0001',
    entityName: 'Security policy',
    result: 'Success',
    severity: 'Critical',
    module: 'Security',
    ip: '10.6.1.77',
    correlationId: 'CORR-47888',
    changes: [
      { field: 'minPasswordLength', before: '10', after: '12' },
      { field: 'ssoEnabled', before: 'false', after: 'true' },
    ],
    link: ['/settings'],
  },
];
