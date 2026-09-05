import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { WorkflowService } from '../../core/workflow.service';
import {
  APPROVER_ROLES,
  ApproverRole,
  STEP_TYPES,
  StepType,
  WorkflowStatus,
} from '../../models/workflow.model';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { IconComponent, IconName } from '../../shared/icon/icon.component';
import { BadgeTone, StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-workflow-builder',
  standalone: true,
  imports: [RouterLink, DatePipe, IconComponent, StatusBadgeComponent, HasPermissionDirective],
  templateUrl: './workflow-builder.component.html',
  styles: [':host { display: block; }'],
})
export class WorkflowBuilderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(WorkflowService);

  readonly stepTypes = STEP_TYPES;
  readonly approverRoles = APPROVER_ROLES;

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );

  readonly workflow = computed(() => this.service.byId(this.id()));

  readonly selectedId = signal<string | null>(null);

  readonly selected = computed(() => {
    const workflow = this.workflow();
    const id = this.selectedId();
    if (!workflow) return undefined;
    return workflow.steps.find((step) => step.id === id) ?? workflow.steps[0];
  });

  constructor() {
    // Keep a valid selection when the workflow loads or the selected step is
    // deleted, so the config panel never points at something that is gone.
    effect(() => {
      const workflow = this.workflow();
      if (!workflow) return;
      const current = this.selectedId();
      const stillThere = workflow.steps.some((step) => step.id === current);
      if (!stillThere) {
        this.selectedId.set(workflow.steps[0]?.id ?? null);
      }
    });
  }

  select(stepId: string): void {
    this.selectedId.set(stepId);
  }

  iconFor(type: StepType): IconName {
    switch (type) {
      case 'Notification':
        return 'bell-ring';
      case 'Condition':
        return 'branch';
      case 'Automation':
        return 'bolt';
      default:
        return 'check';
    }
  }

  toneFor(status: WorkflowStatus): BadgeTone {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Draft':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  isFirst(stepId: string): boolean {
    return this.workflow()?.steps[0]?.id === stepId;
  }

  isLast(stepId: string): boolean {
    const steps = this.workflow()?.steps ?? [];
    return steps[steps.length - 1]?.id === stepId;
  }

  addStep(): void {
    const workflow = this.workflow();
    if (!workflow) return;
    const created = this.service.addStep(workflow.id);
    if (created) this.selectedId.set(created.id);
  }

  move(stepId: string, direction: -1 | 1): void {
    const workflow = this.workflow();
    if (!workflow) return;
    this.service.moveStep(workflow.id, stepId, direction);
  }

  remove(stepId: string): void {
    const workflow = this.workflow();
    if (!workflow) return;
    this.service.removeStep(workflow.id, stepId);
  }

  publish(): void {
    const workflow = this.workflow();
    if (workflow) this.service.publish(workflow.id);
  }

  archive(): void {
    const workflow = this.workflow();
    if (workflow) this.service.setStatus(workflow.id, 'Archived');
  }

  // --- Config panel field handlers -----------------------------------------

  private patch(patch: Parameters<WorkflowService['updateStep']>[2]): void {
    const workflow = this.workflow();
    const step = this.selected();
    if (!workflow || !step) return;
    this.service.updateStep(workflow.id, step.id, patch);
  }

  onName(event: Event): void {
    this.patch({ name: (event.target as HTMLInputElement).value });
  }

  onType(event: Event): void {
    this.patch({ type: (event.target as HTMLSelectElement).value as StepType });
  }

  onRole(event: Event): void {
    this.patch({ approverRole: (event.target as HTMLSelectElement).value as ApproverRole });
  }

  onSla(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.patch({ slaHours: Number.isFinite(value) && value > 0 ? value : 1 });
  }

  onEscalation(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const value = Number(raw);
    this.patch({ escalateAfterHours: raw === '' || !Number.isFinite(value) ? null : value });
  }
}
