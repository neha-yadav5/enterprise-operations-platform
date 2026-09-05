export type AuditResult = 'Success' | 'Failure' | 'Denied';

export type AuditSeverity = 'Info' | 'Notice' | 'Warning' | 'Critical';

export type AuditModule =
  | 'Employees'
  | 'Requests'
  | 'Workflow'
  | 'Projects'
  | 'Assets'
  | 'Documents'
  | 'Administration'
  | 'Security';

export type AuditEntityType =
  | 'EMPLOYEE'
  | 'REQUEST'
  | 'WORKFLOW'
  | 'PROJECT'
  | 'ASSET'
  | 'DOCUMENT'
  | 'ROLE'
  | 'SETTING'
  | 'SESSION';

export interface AuditChange {
  field: string;
  before: string;
  after: string;
}

export interface AuditEvent {
  /** Append-only identifier, e.g. AUD-928381. */
  id: string;
  timestamp: string;
  actorId: string;
  /** Screaming-snake verb, e.g. REQUEST_APPROVED. */
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  entityName: string;
  result: AuditResult;
  severity: AuditSeverity;
  module: AuditModule;
  ip: string;
  correlationId: string;
  changes: AuditChange[];
  /** Route to the source record, or null when there is nothing to open. */
  link: string[] | null;
}

export const AUDIT_RESULTS: AuditResult[] = ['Success', 'Failure', 'Denied'];

export const AUDIT_SEVERITIES: AuditSeverity[] = ['Info', 'Notice', 'Warning', 'Critical'];

export const AUDIT_MODULES: AuditModule[] = [
  'Employees',
  'Requests',
  'Workflow',
  'Projects',
  'Assets',
  'Documents',
  'Administration',
  'Security',
];

export const AUDIT_ENTITY_TYPES: AuditEntityType[] = [
  'EMPLOYEE',
  'REQUEST',
  'WORKFLOW',
  'PROJECT',
  'ASSET',
  'DOCUMENT',
  'ROLE',
  'SETTING',
  'SESSION',
];
