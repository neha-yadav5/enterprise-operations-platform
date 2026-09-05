export type ProjectStatus = 'On track' | 'At risk' | 'Blocked' | 'Completed';

export type RiskSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type MilestoneStatus = 'Complete' | 'In progress' | 'Not started';

export interface ProjectMember {
  employeeId: string;
  role: string;
  /** Percentage of the person's time committed to this project. */
  allocation: number;
}

export interface Milestone {
  name: string;
  due: string;
  progress: number;
  status: MilestoneStatus;
}

export interface Risk {
  title: string;
  severity: RiskSeverity;
  ownerId: string;
  mitigation: string;
}

export interface Project {
  /** Business identifier, e.g. PRJ-201. */
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  /** 0-100. */
  progress: number;
  startDate: string;
  dueDate: string;
  leadId: string;
  department: string;
  budget: number;
  spent: number;
  members: ProjectMember[];
  milestones: Milestone[];
  risks: Risk[];
}

export interface ProjectDraft extends Omit<Project, 'id' | 'members' | 'milestones' | 'risks'> {
  id?: string;
}

export const PROJECT_STATUSES: ProjectStatus[] = [
  'On track',
  'At risk',
  'Blocked',
  'Completed',
];

export const RISK_SEVERITIES: RiskSeverity[] = ['Low', 'Medium', 'High', 'Critical'];
