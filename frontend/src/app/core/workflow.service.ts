import { Injectable, computed, signal } from '@angular/core';

import { RequestType } from '../models/request.model';
import { Workflow, WorkflowStep } from '../models/workflow.model';

/**
 * In-memory workflow store.
 *
 * Step ordering is the array order — there is no explicit `position` field to
 * fall out of sync with it. Reordering therefore means moving an element, and
 * every mutation replaces the array so signals fire.
 */
@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private readonly store = signal<Workflow[]>(SEED);

  readonly workflows = this.store.asReadonly();
  readonly count = computed(() => this.store().length);
  readonly activeCount = computed(
    () => this.store().filter((workflow) => workflow.status === 'Active').length,
  );

  byId(id: string): Workflow | undefined {
    return this.store().find((workflow) => workflow.id === id);
  }

  createDraft(name: string, requestType: RequestType): Workflow {
    const workflow: Workflow = {
      id: `WFL-${this.nextNumber()}`,
      name,
      requestType,
      status: 'Draft',
      version: 1,
      updatedAt: STAMP,
      steps: [
        {
          id: 'step-1',
          name: 'Manager approval',
          type: 'Approval',
          approverRole: 'Department Manager',
          slaHours: 24,
          escalateAfterHours: 48,
        },
      ],
    };
    this.store.update((workflows) => [workflow, ...workflows]);
    return workflow;
  }

  addStep(workflowId: string): WorkflowStep | undefined {
    let created: WorkflowStep | undefined;

    this.store.update((workflows) =>
      workflows.map((workflow) => {
        if (workflow.id !== workflowId) return workflow;

        created = {
          id: `step-${nextStepNumber(workflow)}`,
          name: 'New step',
          type: 'Approval',
          approverRole: 'Department Manager',
          slaHours: 24,
          escalateAfterHours: null,
        };
        return { ...workflow, steps: [...workflow.steps, created], updatedAt: STAMP };
      }),
    );

    return created;
  }

  updateStep(workflowId: string, stepId: string, patch: Partial<WorkflowStep>): void {
    this.store.update((workflows) =>
      workflows.map((workflow) =>
        workflow.id === workflowId
          ? {
              ...workflow,
              updatedAt: STAMP,
              steps: workflow.steps.map((step) =>
                step.id === stepId ? { ...step, ...patch } : step,
              ),
            }
          : workflow,
      ),
    );
  }

  removeStep(workflowId: string, stepId: string): void {
    this.store.update((workflows) =>
      workflows.map((workflow) =>
        workflow.id === workflowId
          ? {
              ...workflow,
              updatedAt: STAMP,
              steps: workflow.steps.filter((step) => step.id !== stepId),
            }
          : workflow,
      ),
    );
  }

  /** Moves a step one position toward the start (-1) or end (+1). */
  moveStep(workflowId: string, stepId: string, direction: -1 | 1): void {
    this.store.update((workflows) =>
      workflows.map((workflow) => {
        if (workflow.id !== workflowId) return workflow;

        const index = workflow.steps.findIndex((step) => step.id === stepId);
        const target = index + direction;
        if (index === -1 || target < 0 || target >= workflow.steps.length) return workflow;

        const steps = [...workflow.steps];
        [steps[index], steps[target]] = [steps[target], steps[index]];
        return { ...workflow, steps, updatedAt: STAMP };
      }),
    );
  }

  setStatus(workflowId: string, status: Workflow['status']): void {
    this.store.update((workflows) =>
      workflows.map((workflow) =>
        workflow.id === workflowId ? { ...workflow, status, updatedAt: STAMP } : workflow,
      ),
    );
  }

  /** Publishing a draft bumps the version and marks it active. */
  publish(workflowId: string): void {
    this.store.update((workflows) =>
      workflows.map((workflow) =>
        workflow.id === workflowId
          ? {
              ...workflow,
              status: 'Active',
              version: workflow.version + 1,
              updatedAt: STAMP,
            }
          : workflow,
      ),
    );
  }

  private nextNumber(): number {
    return (
      this.store().reduce((max, workflow) => {
        const numeric = Number(workflow.id.replace(/\D/g, ''));
        return Number.isFinite(numeric) && numeric > max ? numeric : max;
      }, 10) + 1
    );
  }
}

/** Fixed stamp — see the note in RequestService about clock reads and SSR. */
const STAMP = '2026-09-05T09:30:00Z';

function nextStepNumber(workflow: Workflow): number {
  return (
    workflow.steps.reduce((max, step) => {
      const numeric = Number(step.id.replace(/\D/g, ''));
      return Number.isFinite(numeric) && numeric > max ? numeric : max;
    }, 0) + 1
  );
}

const SEED: Workflow[] = [
  {
    id: 'WFL-11',
    name: 'Leave approval',
    requestType: 'Leave',
    status: 'Active',
    version: 4,
    updatedAt: '2026-07-18T11:20:00Z',
    steps: [
      {
        id: 'step-1',
        name: 'Manager review',
        type: 'Approval',
        approverRole: 'Department Manager',
        slaHours: 24,
        escalateAfterHours: 48,
      },
      {
        id: 'step-2',
        name: 'People Ops confirmation',
        type: 'Approval',
        approverRole: 'People Ops Lead',
        slaHours: 48,
        escalateAfterHours: null,
      },
      {
        id: 'step-3',
        name: 'Notify requester',
        type: 'Notification',
        approverRole: 'People Ops Lead',
        slaHours: 1,
        escalateAfterHours: null,
      },
    ],
  },
  {
    id: 'WFL-12',
    name: 'Purchase approval',
    requestType: 'Purchase',
    status: 'Active',
    version: 7,
    updatedAt: '2026-08-02T15:45:00Z',
    steps: [
      {
        id: 'step-1',
        name: 'Manager review',
        type: 'Approval',
        approverRole: 'Department Manager',
        slaHours: 24,
        escalateAfterHours: 48,
      },
      {
        id: 'step-2',
        name: 'Threshold check',
        type: 'Condition',
        approverRole: 'Finance Controller',
        slaHours: 1,
        escalateAfterHours: null,
      },
      {
        id: 'step-3',
        name: 'Finance approval',
        type: 'Approval',
        approverRole: 'Finance Controller',
        slaHours: 48,
        escalateAfterHours: 72,
      },
      {
        id: 'step-4',
        name: 'Raise purchase order',
        type: 'Automation',
        approverRole: 'Finance Controller',
        slaHours: 4,
        escalateAfterHours: null,
      },
    ],
  },
  {
    id: 'WFL-13',
    name: 'Software access request',
    requestType: 'Software access',
    status: 'Active',
    version: 2,
    updatedAt: '2026-06-30T09:10:00Z',
    steps: [
      {
        id: 'step-1',
        name: 'Manager review',
        type: 'Approval',
        approverRole: 'Department Manager',
        slaHours: 24,
        escalateAfterHours: null,
      },
      {
        id: 'step-2',
        name: 'IT provisioning',
        type: 'Approval',
        approverRole: 'IT Administrator',
        slaHours: 72,
        escalateAfterHours: 96,
      },
    ],
  },
  {
    id: 'WFL-14',
    name: 'Promotion review',
    requestType: 'Promotion',
    status: 'Draft',
    version: 1,
    updatedAt: '2026-08-28T16:30:00Z',
    steps: [
      {
        id: 'step-1',
        name: 'Manager endorsement',
        type: 'Approval',
        approverRole: 'Department Manager',
        slaHours: 72,
        escalateAfterHours: null,
      },
      {
        id: 'step-2',
        name: 'People Ops calibration',
        type: 'Approval',
        approverRole: 'People Ops Lead',
        slaHours: 120,
        escalateAfterHours: null,
      },
      {
        id: 'step-3',
        name: 'Executive sign-off',
        type: 'Approval',
        approverRole: 'Chief Operating Officer',
        slaHours: 120,
        escalateAfterHours: null,
      },
    ],
  },
  {
    id: 'WFL-09',
    name: 'Expense reimbursement (legacy)',
    requestType: 'Expense',
    status: 'Archived',
    version: 3,
    updatedAt: '2026-02-14T10:00:00Z',
    steps: [
      {
        id: 'step-1',
        name: 'Manager review',
        type: 'Approval',
        approverRole: 'Department Manager',
        slaHours: 48,
        escalateAfterHours: null,
      },
    ],
  },
];
