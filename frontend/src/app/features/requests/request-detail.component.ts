import { CurrencyPipe, DatePipe, LowerCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { EmployeeService } from '../../core/employee.service';
import { RequestService } from '../../core/request.service';
import { PermissionService } from '../../core/permissions/permission.service';
import { CURRENT_USER_ID } from '../../core/session';
import { fullName, initials } from '../../models/employee.model';
import { RequestState, StepState } from '../../models/request.model';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { BadgeTone, StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    CurrencyPipe,
    LowerCasePipe,
    IconComponent,
    AvatarComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './request-detail.component.html',
  styles: [':host { display: block; }'],
})
export class RequestDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly requestService = inject(RequestService);
  private readonly employeeService = inject(EmployeeService);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );

  readonly request = computed(() => this.requestService.byId(this.id()));

  readonly requester = computed(() => {
    const request = this.request();
    return request ? this.employeeService.byId(request.requesterId) : undefined;
  });

  private readonly permissions = inject(PermissionService);

  readonly canApprove = computed(() => this.permissions.has('requests.approve'));
  readonly canReject = computed(() => this.permissions.has('requests.reject'));

  /**
   * A decision needs both a live step and the permission to make one. Roles
   * that can only read a request see the timeline without the action panel.
   */
  readonly canDecide = computed(() => {
    const request = this.request();
    const live = Boolean(
      request?.state === 'Pending' && request.steps.some((s) => s.state === 'Current'),
    );
    return live && (this.canApprove() || this.canReject());
  });

  /** True when there is a decision outstanding but this role cannot make it. */
  readonly decisionBlocked = computed(() => {
    const request = this.request();
    const live = Boolean(
      request?.state === 'Pending' && request.steps.some((s) => s.state === 'Current'),
    );
    return live && !this.canApprove() && !this.canReject();
  });

  readonly currentStepName = computed(
    () => this.request()?.steps.find((s) => s.state === 'Current')?.name ?? '',
  );

  readonly note = signal('');
  readonly draft = signal('');

  name = fullName;
  initialsOf = initials;

  authorName(id: string): string {
    const employee = this.employeeService.byId(id);
    return employee ? fullName(employee) : 'Unknown';
  }

  authorInitials(id: string): string {
    const employee = this.employeeService.byId(id);
    return employee ? initials(employee) : '—';
  }

  approverName(id: string | null): string {
    if (!id) return '';
    return this.authorName(id);
  }

  toneFor(state: RequestState): BadgeTone {
    switch (state) {
      case 'Approved':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Rejected':
        return 'danger';
      default:
        return 'info';
    }
  }

  /** Dot styling for a timeline step — shape and icon, not colour alone. */
  stepClasses(state: StepState): string {
    switch (state) {
      case 'Complete':
        return 'border-success bg-success text-white';
      case 'Current':
        return 'border-warning bg-warning/15 text-warning-text';
      case 'Rejected':
        return 'border-danger bg-danger text-white';
      default:
        return 'border-border-subtle bg-surface text-content-secondary';
    }
  }

  onNote(event: Event): void {
    this.note.set((event.target as HTMLTextAreaElement).value);
  }

  onDraft(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }

  approve(): void {
    const request = this.request();
    if (!request) return;
    const note = this.note().trim();
    this.requestService.approveCurrent(request.id, note || undefined);
    if (note) this.requestService.comment(request.id, CURRENT_USER_ID, note);
    this.note.set('');
  }

  reject(): void {
    const request = this.request();
    if (!request) return;
    const note = this.note().trim();
    this.requestService.rejectCurrent(request.id, note || undefined);
    if (note) this.requestService.comment(request.id, CURRENT_USER_ID, note);
    this.note.set('');
  }

  requestChanges(): void {
    const request = this.request();
    if (!request) return;
    const note = this.note().trim();
    this.requestService.requestChanges(request.id, note || undefined);
    if (note) this.requestService.comment(request.id, CURRENT_USER_ID, note);
    this.note.set('');
  }

  postComment(): void {
    const request = this.request();
    const body = this.draft().trim();
    if (!request || !body) return;
    this.requestService.comment(request.id, CURRENT_USER_ID, body);
    this.draft.set('');
  }
}
