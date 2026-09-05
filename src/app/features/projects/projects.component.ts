import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CsvExportService } from '../../core/csv-export.service';
import { EmployeeService } from '../../core/employee.service';
import { ProjectService } from '../../core/project.service';
import { fullName, initials } from '../../models/employee.model';
import { PROJECT_STATUSES, Project, ProjectStatus } from '../../models/project.model';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { IconComponent } from '../../shared/icon/icon.component';
import { ProgressBarComponent, ProgressTone } from '../../shared/progress-bar/progress-bar.component';
import { BadgeTone, StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    IconComponent,
    AvatarComponent,
    StatusBadgeComponent,
    ProgressBarComponent,
    HasPermissionDirective,
  ],
  templateUrl: './projects.component.html',
  styles: [':host { display: block; }'],
})
export class ProjectsComponent {
  private readonly projectService = inject(ProjectService);
  private readonly employeeService = inject(EmployeeService);

  readonly statuses = PROJECT_STATUSES;
  readonly total = this.projectService.count;
  readonly counts = this.projectService.statusCounts;

  readonly search = signal('');
  readonly status = signal<ProjectStatus | 'All'>('All');

  readonly filtered = computed<Project[]>(() => {
    const needle = this.search().trim().toLowerCase();
    const status = this.status();

    return this.projectService.projects().filter((project) => {
      if (status !== 'All' && project.status !== status) return false;
      if (!needle) return true;
      return [project.name, project.id, project.department, project.description]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  });

  readonly hasFilters = computed(() => this.search().trim() !== '' || this.status() !== 'All');

  leadOf(project: Project) {
    return this.employeeService.byId(project.leadId);
  }

  leadName(project: Project): string {
    const lead = this.leadOf(project);
    return lead ? fullName(lead) : 'Unassigned';
  }

  leadInitials(project: Project): string {
    const lead = this.leadOf(project);
    return lead ? initials(lead) : '—';
  }

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

  /**
   * True when the due date has passed and the project is not finished.
   *
   * "Today" is a fixed date rather than `new Date()` on purpose: the server
   * prerenders this page and the browser hydrates it, and a clock read on both
   * sides can disagree across a midnight boundary or a timezone gap, which
   * shows up as a hydration mismatch. Once a real clock is needed it belongs
   * behind an injectable the server and client can agree on.
   */
  private readonly today = new Date('2026-09-05');

  isOverdue(project: Project): boolean {
    if (project.status === 'Completed') return false;
    return new Date(project.dueDate) < this.today;
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  onStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value as ProjectStatus | 'All');
  }

  clearFilters(): void {
    this.search.set('');
    this.status.set('All');
  }

  exportCsv(): void {
    this.csv.download(
      'nexusone-projects',
      ['Code', 'Name', 'Department', 'Status', 'Progress %', 'Lead', 'Start', 'Due', 'Budget', 'Spent'],
      this.filtered().map((p) => [
        p.id,
        p.name,
        p.department,
        p.status,
        p.progress,
        this.leadName(p),
        p.startDate,
        p.dueDate,
        p.budget,
        p.spent,
      ]),
    );
  }

  private readonly csv = inject(CsvExportService);
}
