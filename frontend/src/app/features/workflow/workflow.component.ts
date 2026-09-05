import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { WorkflowService } from '../../core/workflow.service';
import { REQUEST_TYPES, RequestType } from '../../models/request.model';
import { Workflow, WorkflowStatus } from '../../models/workflow.model';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { IconComponent } from '../../shared/icon/icon.component';
import { BadgeTone, StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-workflow',
  standalone: true,
  imports: [RouterLink, DatePipe, IconComponent, StatusBadgeComponent, HasPermissionDirective],
  templateUrl: './workflow.component.html',
  styles: [':host { display: block; }'],
})
export class WorkflowComponent {
  private readonly service = inject(WorkflowService);
  private readonly router = inject(Router);

  readonly requestTypes = REQUEST_TYPES;
  readonly total = this.service.count;
  readonly active = this.service.activeCount;

  readonly search = signal('');
  readonly creating = signal(false);
  readonly newName = signal('');
  readonly newType = signal<RequestType>('Leave');

  readonly filtered = computed<Workflow[]>(() => {
    const needle = this.search().trim().toLowerCase();
    const all = this.service.workflows();
    if (!needle) return all;
    return all.filter((workflow) =>
      [workflow.name, workflow.id, workflow.requestType].join(' ').toLowerCase().includes(needle),
    );
  });

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

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  onNewName(event: Event): void {
    this.newName.set((event.target as HTMLInputElement).value);
  }

  onNewType(event: Event): void {
    this.newType.set((event.target as HTMLSelectElement).value as RequestType);
  }

  startCreate(): void {
    this.creating.set(true);
  }

  cancelCreate(): void {
    this.creating.set(false);
    this.newName.set('');
  }

  /** Creates a draft with one starter step, then opens the builder on it. */
  create(): void {
    const name = this.newName().trim();
    if (!name) return;
    const workflow = this.service.createDraft(name, this.newType());
    this.creating.set(false);
    this.newName.set('');
    void this.router.navigate(['/workflow', workflow.id]);
  }
}
