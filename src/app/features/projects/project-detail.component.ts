import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { EmployeeService } from '../../core/employee.service';
import { ProjectService } from '../../core/project.service';
import { Employee, fullName, initials } from '../../models/employee.model';
import { MilestoneStatus, ProjectStatus, RiskSeverity } from '../../models/project.model';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { IconComponent } from '../../shared/icon/icon.component';
import { ProgressBarComponent, ProgressTone } from '../../shared/progress-bar/progress-bar.component';
import { BadgeTone, StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

type TabId = 'overview' | 'team' | 'milestones' | 'risks' | 'budget' | 'activity';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    CurrencyPipe,
    IconComponent,
    AvatarComponent,
    StatusBadgeComponent,
    ProgressBarComponent,
    HasPermissionDirective,
  ],
  templateUrl: './project-detail.component.html',
  styles: [':host { display: block; }'],
})
export class ProjectDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);
  private readonly employeeService = inject(EmployeeService);

  readonly tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'team', label: 'Team' },
    { id: 'milestones', label: 'Milestones' },
    { id: 'risks', label: 'Risks' },
    { id: 'budget', label: 'Budget' },
    { id: 'activity', label: 'Activity' },
  ];

  readonly activeTab = signal<TabId>('overview');

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );

  readonly project = computed(() => this.projectService.byId(this.id()));

  readonly lead = computed(() => {
    const project = this.project();
    return project ? this.employeeService.byId(project.leadId) : undefined;
  });

  readonly team = computed(() => {
    const project = this.project();
    if (!project) return [];
    return project.members
      .map((member) => ({ member, employee: this.employeeService.byId(member.employeeId) }))
      .filter((entry): entry is { member: (typeof project.members)[number]; employee: Employee } =>
        Boolean(entry.employee),
      );
  });

  readonly openRisks = computed(() => this.project()?.risks ?? []);

  readonly budgetUsedPct = computed(() => {
    const project = this.project();
    if (!project || project.budget === 0) return 0;
    return Math.round((project.spent / project.budget) * 100);
  });

  readonly remaining = computed(() => {
    const project = this.project();
    return project ? project.budget - project.spent : 0;
  });

  name = fullName;
  initialsOf = initials;

  toneFor(status: ProjectStatus): BadgeTone {
    switch (status) {
      case 'On track':
        return 'success';
      case 'At risk':
        return 'warning';
      case 'Blocked':
        return 'danger';
      default:
        return 'info';
    }
  }

  progressTone(status: ProjectStatus): ProgressTone {
    switch (status) {
      case 'At risk':
        return 'warning';
      case 'Blocked':
        return 'danger';
      case 'Completed':
        return 'success';
      default:
        return 'primary';
    }
  }

  milestoneTone(status: MilestoneStatus): BadgeTone {
    switch (status) {
      case 'Complete':
        return 'success';
      case 'In progress':
        return 'info';
      default:
        return 'neutral';
    }
  }

  severityTone(severity: RiskSeverity): BadgeTone {
    switch (severity) {
      case 'Critical':
      case 'High':
        return 'danger';
      case 'Medium':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  /** Budget bar turns amber past 85% and red once it is over. */
  budgetTone(): ProgressTone {
    const used = this.budgetUsedPct();
    if (used > 100) return 'danger';
    if (used >= 85) return 'warning';
    return 'primary';
  }

  ownerName(employeeId: string): string {
    const employee = this.employeeService.byId(employeeId);
    return employee ? fullName(employee) : 'Unassigned';
  }

  // --- Add member ----------------------------------------------------------

  readonly addingMember = signal(false);
  readonly newMemberId = signal('');
  readonly newMemberRole = signal('');
  readonly newMemberAllocation = signal(25);

  /** Everyone not already on the project, and not the lead. */
  readonly assignable = computed(() => {
    const project = this.project();
    if (!project) return [];
    const taken = new Set([project.leadId, ...project.members.map((m) => m.employeeId)]);
    return this.employeeService
      .employees()
      .filter((employee) => !taken.has(employee.id) && employee.status !== 'Inactive');
  });

  readonly canAddMember = computed(
    () => this.newMemberId() !== '' && this.newMemberRole().trim() !== '',
  );

  startAddMember(): void {
    this.addingMember.set(true);
    this.newMemberId.set('');
    this.newMemberRole.set('');
    this.newMemberAllocation.set(25);
  }

  cancelAddMember(): void {
    this.addingMember.set(false);
  }

  onMemberId(event: Event): void {
    this.newMemberId.set((event.target as HTMLSelectElement).value);
  }

  onMemberRole(event: Event): void {
    this.newMemberRole.set((event.target as HTMLInputElement).value);
  }

  onMemberAllocation(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.newMemberAllocation.set(Math.max(1, Math.min(100, value || 1)));
  }

  confirmAddMember(): void {
    const project = this.project();
    if (!project || !this.canAddMember()) return;

    this.projectService.addMember(
      project.id,
      this.newMemberId(),
      this.newMemberRole().trim(),
      this.newMemberAllocation(),
    );
    this.addingMember.set(false);
    this.activeTab.set('team');
  }

  removeMember(employeeId: string): void {
    const project = this.project();
    if (project) this.projectService.removeMember(project.id, employeeId);
  }
}
