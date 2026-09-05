import { Injectable, computed, signal } from '@angular/core';

import {
  ApprovalStep,
  MONETARY_TYPES,
  RequestDraft,
  RequestItem,
  RequestState,
} from '../models/request.model';

/**
 * In-memory request store, including the approval chain.
 *
 * Decisions mutate the chain in place: approving the current step completes it
 * and promotes the next waiting step. That logic lives here rather than in the
 * detail component so the rule is testable and has one home when the workflow
 * engine replaces it.
 */
@Injectable({ providedIn: 'root' })
export class RequestService {
  private readonly store = signal<RequestItem[]>(SEED);

  readonly requests = this.store.asReadonly();
  readonly count = computed(() => this.store().length);

  readonly pendingCount = computed(
    () => this.store().filter((request) => request.state === 'Pending').length,
  );

  byId(id: string): RequestItem | undefined {
    return this.store().find((request) => request.id === id);
  }

  forEmployee(employeeId: string): RequestItem[] {
    return this.store().filter((request) => request.requesterId === employeeId);
  }

  nextId(): string {
    const highest = this.store().reduce((max, request) => {
      const numeric = Number(request.id.replace(/\D/g, ''));
      return Number.isFinite(numeric) && numeric > max ? numeric : max;
    }, 4800);
    return `REQ-${highest + 1}`;
  }

  add(draft: RequestDraft): RequestItem {
    const request: RequestItem = {
      id: this.nextId(),
      type: draft.type,
      title: draft.title,
      requesterId: draft.requesterId,
      submittedAt: '2026-09-05T09:00:00Z',
      state: 'Pending',
      amount: MONETARY_TYPES.includes(draft.type) ? draft.amount : undefined,
      details: draft.details,
      steps: defaultChain(draft.type),
      comments: [],
    };
    this.store.update((requests) => [request, ...requests]);
    return request;
  }

  /** Completes the current step and promotes the next one, or finishes. */
  approveCurrent(id: string, note?: string): void {
    this.store.update((requests) =>
      requests.map((request) => {
        if (request.id !== id) return request;

        const index = request.steps.findIndex((step) => step.state === 'Current');
        if (index === -1) return request;

        const steps = request.steps.map((step, i): ApprovalStep => {
          if (i === index) {
            return { ...step, state: 'Complete', decidedAt: DECISION_STAMP, note };
          }
          if (i === index + 1) return { ...step, state: 'Current' };
          return step;
        });

        const finished = index === request.steps.length - 1;
        return { ...request, steps, state: finished ? 'Approved' : 'Pending' };
      }),
    );
  }

  rejectCurrent(id: string, note?: string): void {
    this.setDecision(id, 'Rejected', note);
  }

  requestChanges(id: string, note?: string): void {
    this.setDecision(id, 'Changes requested', note);
  }

  private setDecision(id: string, state: RequestState, note?: string): void {
    this.store.update((requests) =>
      requests.map((request) => {
        if (request.id !== id) return request;

        const steps = request.steps.map((step): ApprovalStep =>
          step.state === 'Current'
            ? { ...step, state: 'Rejected', decidedAt: DECISION_STAMP, note }
            : step,
        );
        return { ...request, steps, state };
      }),
    );
  }

  comment(id: string, authorId: string, body: string): void {
    this.store.update((requests) =>
      requests.map((request) =>
        request.id === id
          ? { ...request, comments: [...request.comments, { authorId, body, at: DECISION_STAMP }] }
          : request,
      ),
    );
  }
}

/**
 * Fixed stamp rather than `new Date()`: the page prerenders on the server and
 * hydrates in the browser, and two clock reads can disagree. Replace with an
 * injectable clock when the backend supplies real timestamps.
 */
const DECISION_STAMP = '2026-09-05T09:30:00Z';

function defaultChain(type: RequestItem['type']): ApprovalStep[] {
  const financeTypes = ['Purchase', 'Expense', 'Travel'];
  const chain: ApprovalStep[] = [
    { name: 'Submitted', approverId: null, state: 'Complete', decidedAt: DECISION_STAMP },
    { name: 'Manager review', approverId: 'EMP-1008', state: 'Current' },
  ];

  if (financeTypes.includes(type)) {
    chain.push({ name: 'Finance approval', approverId: 'EMP-1031', state: 'Waiting' });
  }
  if (type === 'Software access' || type === 'Asset') {
    chain.push({ name: 'IT provisioning', approverId: 'EMP-1063', state: 'Waiting' });
  }
  if (type === 'Promotion' || type === 'Leave') {
    chain.push({ name: 'People Ops', approverId: 'EMP-1015', state: 'Waiting' });
  }

  return chain;
}

const SEED: RequestItem[] = [
  {
    id: 'REQ-4821',
    type: 'Leave',
    title: 'Annual leave — 12 to 14 August',
    requesterId: 'EMP-1042',
    submittedAt: '2026-08-03T10:12:00Z',
    state: 'Pending',
    details: [
      { label: 'Leave type', value: 'Annual leave' },
      { label: 'Start date', value: '12 August 2026' },
      { label: 'End date', value: '14 August 2026' },
      { label: 'Working days', value: '3' },
      { label: 'Reason', value: 'Family event' },
    ],
    steps: [
      {
        name: 'Submitted',
        approverId: null,
        state: 'Complete',
        decidedAt: '2026-08-03T10:12:00Z',
      },
      { name: 'Manager review', approverId: 'EMP-1008', state: 'Current' },
      { name: 'People Ops', approverId: 'EMP-1015', state: 'Waiting' },
    ],
    comments: [
      {
        authorId: 'EMP-1042',
        body: 'I need leave from 12 to 14 August for a family event. Handover notes are in the team drive.',
        at: '2026-08-03T10:14:00Z',
      },
      {
        authorId: 'EMP-1008',
        body: 'Thanks — can you confirm the migration testing handover is covered before you go?',
        at: '2026-08-03T14:02:00Z',
      },
    ],
  },
  {
    id: 'REQ-4818',
    type: 'Purchase',
    title: 'Additional load-testing licences',
    requesterId: 'EMP-1052',
    submittedAt: '2026-08-01T08:40:00Z',
    state: 'Pending',
    amount: 7400,
    details: [
      { label: 'Vendor', value: 'LoadForge' },
      { label: 'Quantity', value: '4 seats' },
      { label: 'Term', value: '12 months' },
      { label: 'Justification', value: 'Payroll migration parallel-run testing' },
    ],
    steps: [
      { name: 'Submitted', approverId: null, state: 'Complete', decidedAt: '2026-08-01T08:40:00Z' },
      {
        name: 'Manager review',
        approverId: 'EMP-1008',
        state: 'Complete',
        decidedAt: '2026-08-01T11:20:00Z',
        note: 'Needed for the second parallel run.',
      },
      { name: 'Finance approval', approverId: 'EMP-1031', state: 'Current' },
    ],
    comments: [],
  },
  {
    id: 'REQ-4812',
    type: 'Travel',
    title: 'Berlin office visit — relocation planning',
    requesterId: 'EMP-1044',
    submittedAt: '2026-07-28T16:05:00Z',
    state: 'Approved',
    amount: 1850,
    details: [
      { label: 'Destination', value: 'Berlin' },
      { label: 'Departure', value: '9 September 2026' },
      { label: 'Return', value: '12 September 2026' },
      { label: 'Purpose', value: 'Floor plan walkthrough with the fit-out contractor' },
    ],
    steps: [
      { name: 'Submitted', approverId: null, state: 'Complete', decidedAt: '2026-07-28T16:05:00Z' },
      {
        name: 'Manager review',
        approverId: 'EMP-1001',
        state: 'Complete',
        decidedAt: '2026-07-29T09:15:00Z',
      },
      {
        name: 'Finance approval',
        approverId: 'EMP-1031',
        state: 'Complete',
        decidedAt: '2026-07-30T13:44:00Z',
        note: 'Within the relocation budget line.',
      },
    ],
    comments: [],
  },
  {
    id: 'REQ-4809',
    type: 'Software access',
    title: 'Warehouse query access for reporting build',
    requesterId: 'EMP-1094',
    submittedAt: '2026-07-24T11:30:00Z',
    state: 'Pending',
    details: [
      { label: 'System', value: 'Reporting warehouse (staging)' },
      { label: 'Access level', value: 'Read-only' },
      { label: 'Duration', value: 'Until 31 March 2027' },
    ],
    steps: [
      { name: 'Submitted', approverId: null, state: 'Complete', decidedAt: '2026-07-24T11:30:00Z' },
      {
        name: 'Manager review',
        approverId: 'EMP-1031',
        state: 'Complete',
        decidedAt: '2026-07-24T15:02:00Z',
      },
      { name: 'IT provisioning', approverId: 'EMP-1063', state: 'Current' },
    ],
    comments: [
      {
        authorId: 'EMP-1063',
        body: 'Holding until the access review finishes — I do not want to grant new roles mid-audit.',
        at: '2026-07-25T08:10:00Z',
      },
    ],
  },
  {
    id: 'REQ-4803',
    type: 'Asset',
    title: 'Replacement laptop — battery failure',
    requesterId: 'EMP-1023',
    submittedAt: '2026-07-19T09:02:00Z',
    state: 'Approved',
    details: [
      { label: 'Current asset', value: 'AST-8801 — MacBook Pro 16"' },
      { label: 'Issue', value: 'Battery no longer holds charge' },
      { label: 'Preferred replacement', value: 'MacBook Pro 16" M4' },
    ],
    steps: [
      { name: 'Submitted', approverId: null, state: 'Complete', decidedAt: '2026-07-19T09:02:00Z' },
      {
        name: 'Manager review',
        approverId: 'EMP-1001',
        state: 'Complete',
        decidedAt: '2026-07-19T10:41:00Z',
      },
      {
        name: 'IT provisioning',
        approverId: 'EMP-1063',
        state: 'Complete',
        decidedAt: '2026-07-22T14:20:00Z',
        note: 'Replacement shipped, old unit to be returned.',
      },
    ],
    comments: [],
  },
  {
    id: 'REQ-4798',
    type: 'Expense',
    title: 'Conference travel reimbursement',
    requesterId: 'EMP-1071',
    submittedAt: '2026-07-15T17:22:00Z',
    state: 'Changes requested',
    amount: 620,
    details: [
      { label: 'Event', value: 'PlatformCon 2026' },
      { label: 'Category', value: 'Travel and accommodation' },
      { label: 'Receipts', value: '3 attached' },
    ],
    steps: [
      { name: 'Submitted', approverId: null, state: 'Complete', decidedAt: '2026-07-15T17:22:00Z' },
      {
        name: 'Manager review',
        approverId: 'EMP-1008',
        state: 'Rejected',
        decidedAt: '2026-07-16T09:30:00Z',
        note: 'Hotel receipt is illegible — please re-upload.',
      },
      { name: 'Finance approval', approverId: 'EMP-1031', state: 'Waiting' },
    ],
    comments: [
      {
        authorId: 'EMP-1008',
        body: 'The hotel receipt scan is unreadable. Re-upload and I will approve straight away.',
        at: '2026-07-16T09:31:00Z',
      },
    ],
  },
  {
    id: 'REQ-4790',
    type: 'Promotion',
    title: 'Promotion review — Senior to Staff',
    requesterId: 'EMP-1052',
    submittedAt: '2026-07-08T13:15:00Z',
    state: 'Rejected',
    details: [
      { label: 'Current grade', value: 'Senior Engineer' },
      { label: 'Proposed grade', value: 'Staff Engineer' },
      { label: 'Effective from', value: '1 October 2026' },
    ],
    steps: [
      { name: 'Submitted', approverId: null, state: 'Complete', decidedAt: '2026-07-08T13:15:00Z' },
      {
        name: 'Manager review',
        approverId: 'EMP-1008',
        state: 'Rejected',
        decidedAt: '2026-07-11T16:00:00Z',
        note: 'Deferred to the October cycle — revisit after the migration lands.',
      },
      { name: 'People Ops', approverId: 'EMP-1015', state: 'Waiting' },
    ],
    comments: [],
  },
  {
    id: 'REQ-4785',
    type: 'Leave',
    title: 'Parental leave — October to January',
    requesterId: 'EMP-1102',
    submittedAt: '2026-07-02T10:00:00Z',
    state: 'Approved',
    details: [
      { label: 'Leave type', value: 'Parental leave' },
      { label: 'Start date', value: '1 October 2026' },
      { label: 'End date', value: '16 January 2027' },
      { label: 'Working days', value: '78' },
    ],
    steps: [
      { name: 'Submitted', approverId: null, state: 'Complete', decidedAt: '2026-07-02T10:00:00Z' },
      {
        name: 'Manager review',
        approverId: 'EMP-1023',
        state: 'Complete',
        decidedAt: '2026-07-02T14:30:00Z',
      },
      {
        name: 'People Ops',
        approverId: 'EMP-1015',
        state: 'Complete',
        decidedAt: '2026-07-03T09:05:00Z',
        note: 'Cover arranged with the research contractor.',
      },
    ],
    comments: [],
  },
  {
    id: 'REQ-4779',
    type: 'Purchase',
    title: 'Ergonomic chairs for the Lagos office',
    requesterId: 'EMP-1080',
    submittedAt: '2026-06-25T08:15:00Z',
    state: 'Pending',
    amount: 3200,
    details: [
      { label: 'Vendor', value: 'Herman Miller' },
      { label: 'Quantity', value: '8' },
      { label: 'Justification', value: 'Occupational health assessment recommendation' },
    ],
    steps: [
      { name: 'Submitted', approverId: null, state: 'Complete', decidedAt: '2026-06-25T08:15:00Z' },
      { name: 'Manager review', approverId: 'EMP-1063', state: 'Current' },
      { name: 'Finance approval', approverId: 'EMP-1031', state: 'Waiting' },
    ],
    comments: [],
  },
];
