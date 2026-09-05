import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { EmployeeService } from '../../core/employee.service';
import { EmployeeStatus, fullName, initials } from '../../models/employee.model';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { IconComponent } from '../../shared/icon/icon.component';
import { BadgeTone, StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

type TabId = 'overview' | 'projects' | 'assets' | 'requests' | 'documents' | 'activity';

interface Tab {
  id: TabId;
  label: string;
}

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    IconComponent,
    AvatarComponent,
    StatusBadgeComponent,
    HasPermissionDirective,
  ],
  templateUrl: './employee-detail.component.html',
  styles: [':host { display: block; }'],
})
export class EmployeeDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(EmployeeService);

  readonly tabs: Tab[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'projects', label: 'Projects' },
    { id: 'assets', label: 'Assets' },
    { id: 'requests', label: 'Requests' },
    { id: 'documents', label: 'Documents' },
    { id: 'activity', label: 'Activity' },
  ];

  readonly activeTab = signal<TabId>('overview');

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );

  readonly employee = computed(() => this.service.byId(this.id()));

  readonly manager = computed(() => {
    const employee = this.employee();
    return employee ? this.service.managerOf(employee) : undefined;
  });

  readonly reports = computed(() => {
    const employee = this.employee();
    return employee ? this.service.reportsTo(employee.id) : [];
  });

  name = fullName;
  initialsOf = initials;

  toneFor(status: EmployeeStatus): BadgeTone {
    switch (status) {
      case 'Active':
        return 'success';
      case 'On leave':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  /** Label for the tab's empty state — every tab but Overview is unbuilt. */
  emptyCopy(tab: TabId): { title: string; body: string } {
    switch (tab) {
      case 'projects':
        return {
          title: 'No project assignments yet',
          body: 'Project membership arrives with the Projects module in Phase 2.',
        };
      case 'assets':
        return {
          title: 'No assets assigned',
          body: 'Asset assignment arrives with the Assets module in Phase 3.',
        };
      case 'requests':
        return {
          title: 'No requests raised',
          body: 'Leave, travel and purchase requests arrive with the Requests module in Phase 2.',
        };
      case 'documents':
        return {
          title: 'No documents',
          body: 'Contracts and policy acknowledgements arrive with the Documents module in Phase 3.',
        };
      default:
        return {
          title: 'No activity recorded',
          body: 'The audit trail is populated once the backend records events.',
        };
    }
  }
}
