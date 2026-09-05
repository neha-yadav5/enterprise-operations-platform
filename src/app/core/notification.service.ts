import { Injectable, computed, signal } from '@angular/core';

import { AppNotification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly store = signal<AppNotification[]>(SEED);

  readonly notifications = this.store.asReadonly();

  readonly unread = computed(() => this.store().filter((item) => !item.read));
  readonly unreadCount = computed(() => this.unread().length);

  /** Newest first, capped — what the topbar dropdown shows. */
  readonly recent = computed(() => this.store().slice(0, 5));

  markRead(id: string): void {
    this.store.update((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }

  markAllRead(): void {
    this.store.update((items) => items.map((item) => ({ ...item, read: true })));
  }
}

const SEED: AppNotification[] = [
  {
    id: 'NTF-01',
    kind: 'approval',
    title: 'Leave request needs your approval',
    body: 'Amara Okafor · REQ-4821 · annual leave, 12 to 14 August',
    at: '2026-09-05T08:52:00Z',
    read: false,
    link: ['/requests', 'REQ-4821'],
  },
  {
    id: 'NTF-02',
    kind: 'project',
    title: 'Payroll Migration moved to At risk',
    body: 'Identity mapping mismatch raised as a high-severity risk',
    at: '2026-09-05T08:05:00Z',
    read: false,
    link: ['/projects', 'PRJ-201'],
  },
  {
    id: 'NTF-03',
    kind: 'approval',
    title: 'Purchase request waiting on Finance',
    body: 'Lin Wei · REQ-4818 · load-testing licences, $7,400',
    at: '2026-09-05T07:30:00Z',
    read: false,
    link: ['/requests', 'REQ-4818'],
  },
  {
    id: 'NTF-04',
    kind: 'asset',
    title: 'Warranty expiring within 90 days',
    body: 'AST-8712 ThinkPad T480 · already retired, awaiting disposal',
    at: '2026-09-04T16:20:00Z',
    read: false,
    link: ['/assets', 'AST-8712'],
  },
  {
    id: 'NTF-05',
    kind: 'mention',
    title: 'Sofia Bianchi mentioned you',
    body: '“Holding until the access review finishes” · REQ-4809',
    at: '2026-09-04T14:10:00Z',
    read: false,
    link: ['/requests', 'REQ-4809'],
  },
  {
    id: 'NTF-06',
    kind: 'system',
    title: 'Promotion review workflow published',
    body: 'WFL-14 moved from draft to active',
    at: '2026-09-03T11:45:00Z',
    read: true,
    link: ['/workflow', 'WFL-14'],
  },
  {
    id: 'NTF-07',
    kind: 'document',
    title: 'Employee Handbook 2026 updated',
    body: 'Priya Nair published version 4.2',
    at: '2026-09-02T09:15:00Z',
    read: true,
    link: null,
  },
  {
    id: 'NTF-08',
    kind: 'project',
    title: 'Vendor Consolidation is blocked',
    body: 'Legal review unavailable until Q4 · escalated to COO',
    at: '2026-09-01T15:00:00Z',
    read: true,
    link: ['/projects', 'PRJ-212'],
  },
];
