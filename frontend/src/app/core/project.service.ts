import { Injectable, computed, signal } from '@angular/core';

import { Project, ProjectDraft, ProjectStatus } from '../models/project.model';

/**
 * In-memory project store. Same shape and rationale as EmployeeService —
 * synchronous reads so `/projects` prerenders with real rows.
 */
@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly store = signal<Project[]>(SEED);

  readonly projects = this.store.asReadonly();
  readonly count = computed(() => this.store().length);

  /** Status tallies, used by the dashboard donut so both screens agree. */
  readonly statusCounts = computed(() => {
    const counts: Record<ProjectStatus, number> = {
      'On track': 0,
      'At risk': 0,
      Blocked: 0,
      Completed: 0,
    };
    for (const project of this.store()) counts[project.status] += 1;
    return counts;
  });

  readonly activeCount = computed(
    () => this.store().filter((project) => project.status !== 'Completed').length,
  );

  byId(id: string): Project | undefined {
    return this.store().find((project) => project.id === id);
  }

  byLead(employeeId: string): Project[] {
    return this.store().filter((project) => project.leadId === employeeId);
  }

  /** Projects an employee is a lead on or a member of. */
  forEmployee(employeeId: string): Project[] {
    return this.store().filter(
      (project) =>
        project.leadId === employeeId ||
        project.members.some((member) => member.employeeId === employeeId),
    );
  }

  nextId(): string {
    const highest = this.store().reduce((max, project) => {
      const numeric = Number(project.id.replace(/\D/g, ''));
      return Number.isFinite(numeric) && numeric > max ? numeric : max;
    }, 200);
    return `PRJ-${highest + 1}`;
  }

  update(id: string, patch: Partial<Project>): void {
    this.store.update((projects) =>
      projects.map((project) => (project.id === id ? { ...project, ...patch } : project)),
    );
  }

  /** Adds a member, ignoring anyone already on the team. */
  addMember(id: string, employeeId: string, role: string, allocation: number): void {
    this.store.update((projects) =>
      projects.map((project) => {
        if (project.id !== id) return project;
        if (project.members.some((member) => member.employeeId === employeeId)) return project;
        return { ...project, members: [...project.members, { employeeId, role, allocation }] };
      }),
    );
  }

  removeMember(id: string, employeeId: string): void {
    this.store.update((projects) =>
      projects.map((project) =>
        project.id === id
          ? { ...project, members: project.members.filter((m) => m.employeeId !== employeeId) }
          : project,
      ),
    );
  }

  add(draft: ProjectDraft): Project {
    const project: Project = {
      ...draft,
      id: draft.id?.trim() || this.nextId(),
      members: [],
      milestones: [],
      risks: [],
    };
    this.store.update((projects) => [project, ...projects]);
    return project;
  }
}

const SEED: Project[] = [
  {
    id: 'PRJ-201',
    name: 'Payroll Migration',
    description:
      'Move payroll processing off the legacy vendor onto the in-house platform, with parallel runs for two cycles before cutover.',
    status: 'At risk',
    progress: 72,
    startDate: '2026-03-02',
    dueDate: '2026-09-12',
    leadId: 'EMP-1008',
    department: 'Engineering',
    budget: 480000,
    spent: 361000,
    members: [
      { employeeId: 'EMP-1052', role: 'Backend lead', allocation: 80 },
      { employeeId: 'EMP-1071', role: 'Platform engineer', allocation: 50 },
      { employeeId: 'EMP-1094', role: 'Data analyst', allocation: 30 },
      { employeeId: 'EMP-1031', role: 'Finance sponsor', allocation: 15 },
    ],
    milestones: [
      { name: 'Planning', due: '2026-03-27', progress: 100, status: 'Complete' },
      { name: 'Development', due: '2026-06-19', progress: 100, status: 'Complete' },
      { name: 'Testing', due: '2026-08-21', progress: 72, status: 'In progress' },
      { name: 'Launch', due: '2026-09-12', progress: 0, status: 'Not started' },
    ],
    risks: [
      {
        title: 'Identity mapping mismatch between legacy and new records',
        severity: 'High',
        ownerId: 'EMP-1071',
        mitigation: 'Reconciliation script plus a manual review pass on the 400 flagged records.',
      },
      {
        title: 'Second parallel run may slip past the finance close',
        severity: 'Medium',
        ownerId: 'EMP-1031',
        mitigation: 'Book a contingency window in the first week of September.',
      },
    ],
  },
  {
    id: 'PRJ-204',
    name: 'Asset Lifecycle Tracking',
    description:
      'Replace the spreadsheet inventory with tracked asset records, QR labelling and warranty alerts.',
    status: 'On track',
    progress: 48,
    startDate: '2026-05-11',
    dueDate: '2026-11-27',
    leadId: 'EMP-1063',
    department: 'IT',
    budget: 155000,
    spent: 62000,
    members: [
      { employeeId: 'EMP-1080', role: 'Rollout coordinator', allocation: 60 },
      { employeeId: 'EMP-1071', role: 'Integrations', allocation: 25 },
    ],
    milestones: [
      { name: 'Inventory audit', due: '2026-06-30', progress: 100, status: 'Complete' },
      { name: 'Labelling rollout', due: '2026-09-30', progress: 55, status: 'In progress' },
      { name: 'Warranty alerts', due: '2026-11-27', progress: 0, status: 'Not started' },
    ],
    risks: [
      {
        title: 'Remote staff cannot receive physical labels',
        severity: 'Low',
        ownerId: 'EMP-1080',
        mitigation: 'Ship label packs with the next hardware refresh.',
      },
    ],
  },
  {
    id: 'PRJ-209',
    name: 'Onboarding Experience Refresh',
    description:
      'Rebuild the first-week onboarding flow, including document acknowledgement and asset assignment.',
    status: 'On track',
    progress: 61,
    startDate: '2026-04-06',
    dueDate: '2026-10-16',
    leadId: 'EMP-1015',
    department: 'People Ops',
    budget: 96000,
    spent: 54000,
    members: [
      { employeeId: 'EMP-1121', role: 'Process design', allocation: 40 },
      { employeeId: 'EMP-1023', role: 'Product designer', allocation: 45 },
      { employeeId: 'EMP-1102', role: 'UX research', allocation: 30 },
    ],
    milestones: [
      { name: 'Research', due: '2026-05-22', progress: 100, status: 'Complete' },
      { name: 'Flow design', due: '2026-07-31', progress: 100, status: 'Complete' },
      { name: 'Build', due: '2026-10-16', progress: 35, status: 'In progress' },
    ],
    risks: [],
  },
  {
    id: 'PRJ-212',
    name: 'Vendor Consolidation',
    description: 'Reduce the software vendor list from 84 to under 40 and renegotiate the top ten contracts.',
    status: 'Blocked',
    progress: 24,
    startDate: '2026-02-16',
    dueDate: '2026-10-30',
    leadId: 'EMP-1031',
    department: 'Finance',
    budget: 40000,
    spent: 18500,
    members: [{ employeeId: 'EMP-1094', role: 'Spend analysis', allocation: 50 }],
    milestones: [
      { name: 'Spend audit', due: '2026-04-30', progress: 100, status: 'Complete' },
      { name: 'Vendor shortlist', due: '2026-07-31', progress: 40, status: 'In progress' },
      { name: 'Renegotiation', due: '2026-10-30', progress: 0, status: 'Not started' },
    ],
    risks: [
      {
        title: 'Legal review unavailable until Q4',
        severity: 'Critical',
        ownerId: 'EMP-1031',
        mitigation: 'Escalated to COO; external counsel quoted as a fallback.',
      },
    ],
  },
  {
    id: 'PRJ-216',
    name: 'Design System v2',
    description: 'Token-driven component library shared across the operations platform and the public site.',
    status: 'On track',
    progress: 88,
    startDate: '2026-01-12',
    dueDate: '2026-09-25',
    leadId: 'EMP-1023',
    department: 'Design',
    budget: 72000,
    spent: 61000,
    members: [
      { employeeId: 'EMP-1102', role: 'Research', allocation: 25 },
      { employeeId: 'EMP-1042', role: 'Engineering partner', allocation: 35 },
    ],
    milestones: [
      { name: 'Token audit', due: '2026-02-28', progress: 100, status: 'Complete' },
      { name: 'Core components', due: '2026-06-30', progress: 100, status: 'Complete' },
      { name: 'Adoption', due: '2026-09-25', progress: 70, status: 'In progress' },
    ],
    risks: [],
  },
  {
    id: 'PRJ-221',
    name: 'Security Posture Review',
    description: 'Annual review of access controls, session policy and third-party integrations.',
    status: 'At risk',
    progress: 35,
    startDate: '2026-06-01',
    dueDate: '2026-09-30',
    leadId: 'EMP-1063',
    department: 'IT',
    budget: 58000,
    spent: 21000,
    members: [{ employeeId: 'EMP-1071', role: 'Infrastructure', allocation: 30 }],
    milestones: [
      { name: 'Access audit', due: '2026-07-15', progress: 100, status: 'Complete' },
      { name: 'Remediation', due: '2026-09-30', progress: 20, status: 'In progress' },
    ],
    risks: [
      {
        title: 'MFA rollout depends on the identity provider upgrade',
        severity: 'High',
        ownerId: 'EMP-1063',
        mitigation: 'Provider upgrade booked for late August; fallback is TOTP-only enrolment.',
      },
    ],
  },
  {
    id: 'PRJ-225',
    name: 'Workspace Relocation — Berlin',
    description: 'Move the Berlin team to the new floor, including desk allocation and network provisioning.',
    status: 'On track',
    progress: 15,
    startDate: '2026-08-03',
    dueDate: '2027-01-29',
    leadId: 'EMP-1044',
    department: 'Operations',
    budget: 310000,
    spent: 28000,
    members: [{ employeeId: 'EMP-1063', role: 'Network provisioning', allocation: 20 }],
    milestones: [
      { name: 'Floor plan sign-off', due: '2026-09-30', progress: 60, status: 'In progress' },
      { name: 'Fit-out', due: '2026-12-18', progress: 0, status: 'Not started' },
      { name: 'Move weekend', due: '2027-01-29', progress: 0, status: 'Not started' },
    ],
    risks: [],
  },
  {
    id: 'PRJ-198',
    name: 'Expense Policy Rewrite',
    description: 'Rewrite and roll out the expense policy, with approval thresholds by grade.',
    status: 'Completed',
    progress: 100,
    startDate: '2025-11-03',
    dueDate: '2026-04-24',
    leadId: 'EMP-1031',
    department: 'Finance',
    budget: 24000,
    spent: 21800,
    members: [{ employeeId: 'EMP-1015', role: 'Policy review', allocation: 20 }],
    milestones: [
      { name: 'Draft', due: '2026-01-30', progress: 100, status: 'Complete' },
      { name: 'Consultation', due: '2026-03-13', progress: 100, status: 'Complete' },
      { name: 'Rollout', due: '2026-04-24', progress: 100, status: 'Complete' },
    ],
    risks: [],
  },
  {
    id: 'PRJ-193',
    name: 'Recruitment Pipeline Automation',
    description: 'Automate candidate stage transitions and interview scheduling.',
    status: 'Completed',
    progress: 100,
    startDate: '2025-09-15',
    dueDate: '2026-03-06',
    leadId: 'EMP-1015',
    department: 'People Ops',
    budget: 66000,
    spent: 64200,
    members: [{ employeeId: 'EMP-1121', role: 'Recruitment lead', allocation: 45 }],
    milestones: [{ name: 'Rollout', due: '2026-03-06', progress: 100, status: 'Complete' }],
    risks: [],
  },
  {
    id: 'PRJ-228',
    name: 'Reporting Warehouse',
    description: 'Consolidate operational reporting into a single warehouse with scheduled extracts.',
    status: 'On track',
    progress: 8,
    startDate: '2026-08-17',
    dueDate: '2027-03-26',
    leadId: 'EMP-1094',
    department: 'Finance',
    budget: 225000,
    spent: 12000,
    members: [
      { employeeId: 'EMP-1052', role: 'Data pipelines', allocation: 40 },
      { employeeId: 'EMP-1008', role: 'Architecture review', allocation: 10 },
    ],
    milestones: [
      { name: 'Source inventory', due: '2026-10-09', progress: 25, status: 'In progress' },
      { name: 'Warehouse build', due: '2027-01-15', progress: 0, status: 'Not started' },
      { name: 'Report migration', due: '2027-03-26', progress: 0, status: 'Not started' },
    ],
    risks: [],
  },
  {
    id: 'PRJ-231',
    name: 'Contractor Access Review',
    description: 'Quarterly review of contractor accounts and repository permissions.',
    status: 'Blocked',
    progress: 12,
    startDate: '2026-07-06',
    dueDate: '2026-09-18',
    leadId: 'EMP-1080',
    department: 'IT',
    budget: 15000,
    spent: 4200,
    members: [],
    milestones: [{ name: 'Account inventory', due: '2026-08-14', progress: 45, status: 'In progress' }],
    risks: [
      {
        title: 'Contractor list not reconciled with Finance records',
        severity: 'Medium',
        ownerId: 'EMP-1094',
        mitigation: 'Waiting on the vendor consolidation spend audit to complete first.',
      },
    ],
  },
  {
    id: 'PRJ-235',
    name: 'Customer Support Handbook',
    description: 'Document escalation paths and response targets for the support team.',
    status: 'At risk',
    progress: 41,
    startDate: '2026-06-22',
    dueDate: '2026-10-02',
    leadId: 'EMP-1044',
    department: 'Operations',
    budget: 18000,
    spent: 9400,
    members: [{ employeeId: 'EMP-1102', role: 'Content research', allocation: 20 }],
    milestones: [
      { name: 'Escalation map', due: '2026-08-07', progress: 100, status: 'Complete' },
      { name: 'Response targets', due: '2026-10-02', progress: 20, status: 'In progress' },
    ],
    risks: [
      {
        title: 'No owner assigned for tier-3 escalations',
        severity: 'High',
        ownerId: 'EMP-1044',
        mitigation: 'Raised with the COO; decision expected this month.',
      },
    ],
  },
];
