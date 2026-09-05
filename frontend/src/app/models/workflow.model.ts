import { RequestType } from './request.model';

export type StepType = 'Approval' | 'Notification' | 'Condition' | 'Automation';

export type WorkflowStatus = 'Active' | 'Draft' | 'Archived';

/** Roles a step can be routed to, rather than named individuals. */
export const APPROVER_ROLES = [
  'Department Manager',
  'Finance Controller',
  'People Ops Lead',
  'IT Administrator',
  'Chief Operating Officer',
] as const;

export type ApproverRole = (typeof APPROVER_ROLES)[number];

export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  approverRole: ApproverRole;
  /** Target decision time, in hours. */
  slaHours: number;
  /** Hours before escalation fires, or null for no escalation. */
  escalateAfterHours: number | null;
}

export interface Workflow {
  id: string;
  name: string;
  requestType: RequestType;
  status: WorkflowStatus;
  version: number;
  updatedAt: string;
  steps: WorkflowStep[];
}

export const STEP_TYPES: StepType[] = ['Approval', 'Notification', 'Condition', 'Automation'];

export const WORKFLOW_STATUSES: WorkflowStatus[] = ['Active', 'Draft', 'Archived'];
