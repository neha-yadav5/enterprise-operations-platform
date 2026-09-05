import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { AuditService } from '../../core/audit.service';
import { EmployeeService } from '../../core/employee.service';
import {
  AUDIT_ENTITY_TYPES,
  AUDIT_MODULES,
  AUDIT_RESULTS,
  AUDIT_SEVERITIES,
  AuditEvent,
  AuditResult,
  AuditSeverity,
} from '../../models/audit.model';
import { fullName, initials } from '../../models/employee.model';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { IconComponent } from '../../shared/icon/icon.component';
import { BadgeTone, StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [RouterLink, IconComponent, AvatarComponent, StatusBadgeComponent, HasPermissionDirective],
  templateUrl: './audit-logs.component.html',
  styles: [':host { display: block; }'],
})
export class AuditLogsComponent {
  private readonly service = inject(AuditService);
  private readonly employees = inject(EmployeeService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly results = AUDIT_RESULTS;
  readonly severities = AUDIT_SEVERITIES;
  readonly modules = AUDIT_MODULES;
  readonly entityTypes = AUDIT_ENTITY_TYPES;
  readonly actions = this.service.actions;
  readonly actorIds = this.service.actorIds;

  // --- Filter state --------------------------------------------------------
  readonly search = signal('');
  readonly actorId = signal('');
  readonly action = signal('');
  readonly entityType = signal('');
  readonly module = signal('');
  readonly result = signal('');
  readonly severity = signal('');
  readonly page = signal(1);
  readonly size = signal(10);

  readonly filtersOpen = signal(false);
  readonly copiedId = signal<string | null>(null);

  readonly result$ = computed(() =>
    this.service.query({
      search: this.search(),
      actorId: this.actorId(),
      action: this.action(),
      entityType: this.entityType(),
      module: this.module(),
      result: this.result(),
      severity: this.severity(),
      page: this.page(),
      size: this.size(),
    }),
  );

  readonly rows = computed(() => this.result$().rows);
  readonly total = computed(() => this.result$().total);
  readonly pages = computed(() => this.result$().pages);
  readonly currentPage = computed(() => this.result$().page);
  readonly grandTotal = this.service.total;

  readonly activeFilterCount = computed(
    () =>
      [
        this.actorId(),
        this.action(),
        this.entityType(),
        this.module(),
        this.result(),
        this.severity(),
      ].filter(Boolean).length,
  );

  readonly hasQuery = computed(() => this.activeFilterCount() > 0 || this.search().trim() !== '');

  // --- Detail drawer -------------------------------------------------------
  readonly selectedId = signal<string | null>(null);
  readonly selected = computed(() =>
    this.selectedId() ? this.service.byId(this.selectedId()!) : undefined,
  );

  private readonly drawerClose = viewChild<ElementRef<HTMLButtonElement>>('drawerClose');

  /** Element to restore focus to when the drawer closes. */
  private lastTrigger: HTMLElement | null = null;

  constructor() {
    // Move focus into the drawer when it opens. Without this a keyboard user
    // stays on the table row while a dialog is on screen.
    effect(() => {
      if (!this.selected() || !isPlatformBrowser(this.platformId)) return;
      queueMicrotask(() => this.drawerClose()?.nativeElement.focus());
    });
  }

  actorName(event: AuditEvent): string {
    const employee = this.employees.byId(event.actorId);
    return employee ? fullName(employee) : event.actorId;
  }

  actorInitials(event: AuditEvent): string {
    const employee = this.employees.byId(event.actorId);
    return employee ? initials(employee) : '—';
  }

  actorLabel(id: string): string {
    const employee = this.employees.byId(id);
    return employee ? fullName(employee) : id;
  }

  resultTone(result: AuditResult): BadgeTone {
    switch (result) {
      case 'Success':
        return 'success';
      case 'Failure':
        return 'danger';
      default:
        return 'warning';
    }
  }

  severityTone(severity: AuditSeverity): BadgeTone {
    switch (severity) {
      case 'Critical':
        return 'danger';
      case 'Warning':
        return 'warning';
      case 'Notice':
        return 'info';
      default:
        return 'neutral';
    }
  }

  // --- Handlers ------------------------------------------------------------

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  onFilter(which: 'actorId' | 'action' | 'entityType' | 'module' | 'result' | 'severity', event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this[which].set(value);
    this.page.set(1);
  }

  onSize(event: Event): void {
    this.size.set(Number((event.target as HTMLSelectElement).value));
    this.page.set(1);
  }

  reset(): void {
    this.search.set('');
    this.actorId.set('');
    this.action.set('');
    this.entityType.set('');
    this.module.set('');
    this.result.set('');
    this.severity.set('');
    this.page.set(1);
  }

  goto(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.pages()));
  }

  /** `trigger` is a plain Event: the template binds both click and keydown. */
  open(event: AuditEvent, trigger: Event): void {
    this.lastTrigger = trigger.currentTarget as HTMLElement | null;
    this.selectedId.set(event.id);
  }

  close(): void {
    this.selectedId.set(null);
    if (isPlatformBrowser(this.platformId)) {
      queueMicrotask(() => this.lastTrigger?.focus());
    }
  }

  onDrawerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.close();
    }
  }

  async copyId(id: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      await navigator.clipboard.writeText(id);
      this.copiedId.set(id);
    } catch {
      // Clipboard can be blocked by permissions or an insecure origin. Say so
      // rather than showing a success tick that did not happen.
      this.copiedId.set(null);
    }
  }

  /**
   * Client-side CSV of the current filtered result set.
   *
   * The PRD asks for a server-generated, asynchronous export; with no backend
   * this produces the file in the browser instead. It still honours the active
   * filters, which is the part that matters for correctness.
   */
  exportCsv(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const all = this.service.query({
      search: this.search(),
      actorId: this.actorId(),
      action: this.action(),
      entityType: this.entityType(),
      module: this.module(),
      result: this.result(),
      severity: this.severity(),
      page: 1,
      size: Number.MAX_SAFE_INTEGER,
    }).rows;

    const header = [
      'Event ID',
      'Timestamp',
      'Actor',
      'Action',
      'Entity type',
      'Entity ID',
      'Entity name',
      'Result',
      'Severity',
      'Module',
      'Correlation ID',
    ];

    const escape = (value: string): string => `"${value.replace(/"/g, '""')}"`;

    const lines = [
      header.join(','),
      ...all.map((event) =>
        [
          event.id,
          event.timestamp,
          this.actorName(event),
          event.action,
          event.entityType,
          event.entityId,
          event.entityName,
          event.result,
          event.severity,
          event.module,
          event.correlationId,
        ]
          .map((value) => escape(String(value)))
          .join(','),
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'nexusone-audit-events.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
