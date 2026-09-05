import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { DocumentService } from '../../core/document.service';
import { EmployeeService } from '../../core/employee.service';
import { CURRENT_USER_ID } from '../../core/session';
import { DocumentStatus } from '../../models/document.model';
import { fullName, initials } from '../../models/employee.model';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { IconComponent } from '../../shared/icon/icon.component';
import { BadgeTone, StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

type TabId = 'preview' | 'versions' | 'access' | 'activity';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    IconComponent,
    AvatarComponent,
    StatusBadgeComponent,
    HasPermissionDirective,
  ],
  templateUrl: './document-detail.component.html',
  styles: [':host { display: block; }'],
})
export class DocumentDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly documentService = inject(DocumentService);
  private readonly employeeService = inject(EmployeeService);

  readonly tabs: { id: TabId; label: string }[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'versions', label: 'Version history' },
    { id: 'access', label: 'Access' },
    { id: 'activity', label: 'Activity' },
  ];

  readonly activeTab = signal<TabId>('preview');

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );

  readonly document = computed(() => this.documentService.byId(this.id()));

  readonly owner = computed(() => {
    const document = this.document();
    return document ? this.employeeService.byId(document.ownerId) : undefined;
  });

  readonly currentVersion = computed(() => this.document()?.versions[0]);

  name = fullName;
  initialsOf = initials;

  authorName(id: string): string {
    const employee = this.employeeService.byId(id);
    return employee ? fullName(employee) : 'Unknown';
  }

  toneFor(status: DocumentStatus): BadgeTone {
    switch (status) {
      case 'Published':
        return 'success';
      case 'In review':
        return 'warning';
      case 'Draft':
        return 'info';
      default:
        return 'neutral';
    }
  }

  sizeLabel(): string {
    const document = this.document();
    if (!document) return '';
    return document.sizeKb >= 1024
      ? `${(document.sizeKb / 1024).toFixed(1)} MB`
      : `${document.sizeKb} kB`;
  }

  // --- Versions ------------------------------------------------------------

  readonly addingVersion = signal(false);
  readonly versionNote = signal('');

  startVersion(): void {
    this.addingVersion.set(true);
    this.versionNote.set('');
  }

  cancelVersion(): void {
    this.addingVersion.set(false);
  }

  onVersionNote(event: Event): void {
    this.versionNote.set((event.target as HTMLTextAreaElement).value);
  }

  confirmVersion(): void {
    const item = this.document();
    const note = this.versionNote().trim();
    if (!item || !note) return;

    this.documentService.addVersion(item.id, CURRENT_USER_ID, note);
    this.addingVersion.set(false);
    this.activeTab.set('versions');
  }

  restore(version: string): void {
    const item = this.document();
    if (item) this.documentService.restoreVersion(item.id, version, CURRENT_USER_ID);
  }
}
