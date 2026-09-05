export type RequestType =
  | 'Leave'
  | 'Travel'
  | 'Purchase'
  | 'Expense'
  | 'Promotion'
  | 'Asset'
  | 'Software access';

export type RequestState = 'Pending' | 'Approved' | 'Rejected' | 'Changes requested';

/** State of a single stop on the approval chain. */
export type StepState = 'Complete' | 'Current' | 'Waiting' | 'Rejected';

export interface ApprovalStep {
  name: string;
  approverId: string | null;
  state: StepState;
  /** ISO timestamp, present once the step has been decided. */
  decidedAt?: string;
  note?: string;
}

export interface RequestComment {
  authorId: string;
  body: string;
  at: string;
}

export interface RequestDetailField {
  label: string;
  value: string;
}

export interface RequestItem {
  /** Business identifier, e.g. REQ-4821. */
  id: string;
  type: RequestType;
  title: string;
  requesterId: string;
  submittedAt: string;
  state: RequestState;
  /** Present on Purchase, Expense and Travel requests. */
  amount?: number;
  details: RequestDetailField[];
  steps: ApprovalStep[];
  comments: RequestComment[];
}

export interface RequestDraft {
  type: RequestType;
  title: string;
  requesterId: string;
  amount?: number;
  details: RequestDetailField[];
}

export const REQUEST_TYPES: RequestType[] = [
  'Leave',
  'Travel',
  'Purchase',
  'Expense',
  'Promotion',
  'Asset',
  'Software access',
];

export const REQUEST_STATES: RequestState[] = [
  'Pending',
  'Approved',
  'Rejected',
  'Changes requested',
];

/** Types that carry a monetary value, so the form knows when to ask for one. */
export const MONETARY_TYPES: RequestType[] = ['Travel', 'Purchase', 'Expense'];
