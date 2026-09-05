import { Injectable, computed, signal } from '@angular/core';

import { DOCUMENT_FOLDERS, DocumentDraft, DocumentItem } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly store = signal<DocumentItem[]>(SEED);

  readonly documents = this.store.asReadonly();
  readonly count = computed(() => this.store().length);

  /** Folder names with how many documents each holds, for the tree. */
  readonly folders = computed(() =>
    DOCUMENT_FOLDERS.map((name) => ({
      name,
      count: this.store().filter((document) => document.folder === name).length,
    })),
  );

  byId(id: string): DocumentItem | undefined {
    return this.store().find((document) => document.id === id);
  }

  nextId(): string {
    const highest = this.store().reduce((max, document) => {
      const numeric = Number(document.id.replace(/\D/g, ''));
      return Number.isFinite(numeric) && numeric > max ? numeric : max;
    }, 3300);
    return `DOC-${highest + 1}`;
  }

  update(id: string, patch: Partial<DocumentItem>): void {
    this.store.update((documents) =>
      documents.map((document) =>
        document.id === id ? { ...document, ...patch, updatedAt: STAMP } : document,
      ),
    );
  }

  /**
   * Restoring re-publishes an old version as a new one rather than deleting
   * the versions above it — version history is a record, not a stack.
   */
  restoreVersion(id: string, version: string, authorId: string): void {
    this.store.update((documents) =>
      documents.map((document) => {
        if (document.id !== id) return document;
        const source = document.versions.find((v) => v.version === version);
        if (!source) return document;

        const next = nextVersionLabel(document.versions[0]?.version ?? 'v1.0');
        return {
          ...document,
          updatedAt: STAMP,
          versions: [
            { version: next, at: STAMP, authorId, note: `Restored from ${version}` },
            ...document.versions,
          ],
        };
      }),
    );
  }

  /** Appends a new version entry. */
  addVersion(id: string, authorId: string, note: string): void {
    this.store.update((documents) =>
      documents.map((document) => {
        if (document.id !== id) return document;
        const next = nextVersionLabel(document.versions[0]?.version ?? 'v1.0');
        return {
          ...document,
          updatedAt: STAMP,
          versions: [{ version: next, at: STAMP, authorId, note }, ...document.versions],
        };
      }),
    );
  }

  add(draft: DocumentDraft): DocumentItem {
    const document: DocumentItem = {
      ...draft,
      id: draft.id?.trim() || this.nextId(),
      updatedAt: STAMP,
      versions: [
        { version: 'v1.0', at: STAMP, authorId: draft.ownerId, note: 'Initial upload' },
      ],
    };
    this.store.update((documents) => [document, ...documents]);
    return document;
  }
}

/** Fixed stamp — see the note in RequestService about clock reads and SSR. */
const STAMP = '2026-09-05T09:30:00Z';

/** v4.2 -> v4.3, and anything unparseable falls back to v1.1. */
function nextVersionLabel(current: string): string {
  const match = /^v(\d+)\.(\d+)/.exec(current);
  if (!match) return 'v1.1';
  return `v${match[1]}.${Number(match[2]) + 1}`;
}

const SEED: DocumentItem[] = [
  {
    id: 'DOC-3301',
    name: 'Employee Handbook 2026',
    folder: 'Policies',
    format: 'PDF',
    status: 'Published',
    ownerId: 'EMP-1015',
    updatedAt: '2026-09-02T09:15:00Z',
    sizeKb: 2840,
    access: 'Everyone',
    tags: ['handbook', 'policy'],
    versions: [
      { version: 'v4.2', at: '2026-09-02T09:15:00Z', authorId: 'EMP-1015', note: 'Updated leave policy section' },
      { version: 'v4.1', at: '2026-05-14T11:00:00Z', authorId: 'EMP-1015', note: 'Annual review' },
      { version: 'v4.0', at: '2026-01-09T14:30:00Z', authorId: 'EMP-1121', note: 'Rewritten for 2026' },
    ],
  },
  {
    id: 'DOC-3305',
    name: 'Expense Policy',
    folder: 'Policies',
    format: 'PDF',
    status: 'Published',
    ownerId: 'EMP-1031',
    updatedAt: '2026-04-24T10:00:00Z',
    sizeKb: 610,
    access: 'Everyone',
    tags: ['finance', 'policy'],
    versions: [
      { version: 'v2.0', at: '2026-04-24T10:00:00Z', authorId: 'EMP-1031', note: 'New approval thresholds by grade' },
      { version: 'v1.0', at: '2024-02-11T09:00:00Z', authorId: 'EMP-1031', note: 'Original' },
    ],
  },
  {
    id: 'DOC-3310',
    name: 'Information Security Policy',
    folder: 'Policies',
    format: 'PDF',
    status: 'In review',
    ownerId: 'EMP-1063',
    updatedAt: '2026-08-19T15:40:00Z',
    sizeKb: 1240,
    access: 'Everyone',
    tags: ['security', 'policy'],
    versions: [
      { version: 'v3.1-draft', at: '2026-08-19T15:40:00Z', authorId: 'EMP-1063', note: 'MFA requirements added' },
      { version: 'v3.0', at: '2025-09-30T12:00:00Z', authorId: 'EMP-1063', note: 'Annual review' },
    ],
  },
  {
    id: 'DOC-3318',
    name: 'LoadForge Master Agreement',
    folder: 'Contracts',
    format: 'PDF',
    status: 'Published',
    ownerId: 'EMP-1031',
    updatedAt: '2026-08-04T13:20:00Z',
    sizeKb: 980,
    access: 'Restricted',
    tags: ['vendor', 'contract'],
    versions: [
      { version: 'v1.0', at: '2026-08-04T13:20:00Z', authorId: 'EMP-1031', note: 'Signed copy' },
    ],
  },
  {
    id: 'DOC-3322',
    name: 'Berlin Office Lease',
    folder: 'Contracts',
    format: 'PDF',
    status: 'Published',
    ownerId: 'EMP-1044',
    updatedAt: '2026-07-11T08:45:00Z',
    sizeKb: 3120,
    access: 'Restricted',
    tags: ['property', 'contract'],
    versions: [
      { version: 'v1.1', at: '2026-07-11T08:45:00Z', authorId: 'EMP-1044', note: 'Fit-out addendum' },
      { version: 'v1.0', at: '2026-06-02T16:10:00Z', authorId: 'EMP-1044', note: 'Executed lease' },
    ],
  },
  {
    id: 'DOC-3330',
    name: 'FY26 Budget Model',
    folder: 'Finance',
    format: 'Spreadsheet',
    status: 'Published',
    ownerId: 'EMP-1094',
    updatedAt: '2026-08-30T17:05:00Z',
    sizeKb: 4400,
    access: 'Department',
    tags: ['budget', 'planning'],
    versions: [
      { version: 'v6', at: '2026-08-30T17:05:00Z', authorId: 'EMP-1094', note: 'Q3 actuals loaded' },
      { version: 'v5', at: '2026-07-31T16:00:00Z', authorId: 'EMP-1094', note: 'Q2 actuals' },
    ],
  },
  {
    id: 'DOC-3334',
    name: 'Vendor Spend Audit',
    folder: 'Finance',
    format: 'Spreadsheet',
    status: 'Draft',
    ownerId: 'EMP-1094',
    updatedAt: '2026-08-22T11:30:00Z',
    sizeKb: 1860,
    access: 'Department',
    tags: ['vendor', 'audit'],
    versions: [
      { version: 'v0.4', at: '2026-08-22T11:30:00Z', authorId: 'EMP-1094', note: 'Shortlist added' },
    ],
  },
  {
    id: 'DOC-3341',
    name: 'Payroll Migration Runbook',
    folder: 'Engineering',
    format: 'Markdown',
    status: 'Published',
    ownerId: 'EMP-1052',
    updatedAt: '2026-08-27T09:50:00Z',
    sizeKb: 96,
    access: 'Department',
    tags: ['runbook', 'migration'],
    versions: [
      { version: 'v2.3', at: '2026-08-27T09:50:00Z', authorId: 'EMP-1052', note: 'Rollback steps expanded' },
      { version: 'v2.2', at: '2026-08-06T14:15:00Z', authorId: 'EMP-1071', note: 'Parallel-run checklist' },
    ],
  },
  {
    id: 'DOC-3346',
    name: 'Architecture Decision Records',
    folder: 'Engineering',
    format: 'Markdown',
    status: 'Published',
    ownerId: 'EMP-1008',
    updatedAt: '2026-08-12T10:20:00Z',
    sizeKb: 210,
    access: 'Department',
    tags: ['architecture'],
    versions: [
      { version: 'v1.9', at: '2026-08-12T10:20:00Z', authorId: 'EMP-1008', note: 'ADR-019 warehouse choice' },
    ],
  },
  {
    id: 'DOC-3352',
    name: 'New Starter Checklist',
    folder: 'Onboarding',
    format: 'Word',
    status: 'Published',
    ownerId: 'EMP-1121',
    updatedAt: '2026-07-22T08:00:00Z',
    sizeKb: 180,
    access: 'Everyone',
    tags: ['onboarding'],
    versions: [
      { version: 'v3.0', at: '2026-07-22T08:00:00Z', authorId: 'EMP-1121', note: 'Aligned to the new flow' },
    ],
  },
  {
    id: 'DOC-3358',
    name: 'IT Setup Guide',
    folder: 'Onboarding',
    format: 'PDF',
    status: 'Published',
    ownerId: 'EMP-1080',
    updatedAt: '2026-06-15T13:00:00Z',
    sizeKb: 720,
    access: 'Everyone',
    tags: ['onboarding', 'it'],
    versions: [
      { version: 'v2.1', at: '2026-06-15T13:00:00Z', authorId: 'EMP-1080', note: 'Added MDM enrolment' },
    ],
  },
  {
    id: 'DOC-3290',
    name: 'Expense Policy (2024)',
    folder: 'Policies',
    format: 'PDF',
    status: 'Archived',
    ownerId: 'EMP-1031',
    updatedAt: '2024-02-11T09:00:00Z',
    sizeKb: 540,
    access: 'Everyone',
    tags: ['finance', 'archived'],
    versions: [
      { version: 'v1.0', at: '2024-02-11T09:00:00Z', authorId: 'EMP-1031', note: 'Superseded by DOC-3305' },
    ],
  },
];
