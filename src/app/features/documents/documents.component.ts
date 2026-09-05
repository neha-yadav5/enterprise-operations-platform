import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DocumentService } from '../../core/document.service';
import { EmployeeService } from '../../core/employee.service';
import { DocumentItem, DocumentStatus } from '../../models/document.model';
import { fullName } from '../../models/employee.model';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { IconComponent } from '../../shared/icon/icon.component';
import { BadgeTone, StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [RouterLink, DatePipe, IconComponent, StatusBadgeComponent, HasPermissionDirective],
  templateUrl: './documents.component.html',
  styles: [':host { display: block; }'],
})
export class DocumentsComponent {
  private readonly documentService = inject(DocumentService);
  private readonly employeeService = inject(EmployeeService);

  readonly folders = this.documentService.folders;
  readonly total = this.documentService.count;

  readonly folder = signal<string | 'All'>('All');
  readonly search = signal('');

  readonly filtered = computed<DocumentItem[]>(() => {
    const needle = this.search().trim().toLowerCase();
    const folder = this.folder();

    return this.documentService.documents().filter((document) => {
      if (folder !== 'All' && document.folder !== folder) return false;
      if (!needle) return true;
      return [document.name, document.id, document.folder, document.tags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  });

  ownerName(document: DocumentItem): string {
    const owner = this.employeeService.byId(document.ownerId);
    return owner ? fullName(owner) : 'Unknown';
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

  /** Human size — kB below a megabyte, MB above it. */
  sizeLabel(document: DocumentItem): string {
    return document.sizeKb >= 1024
      ? `${(document.sizeKb / 1024).toFixed(1)} MB`
      : `${document.sizeKb} kB`;
  }

  selectFolder(name: string | 'All'): void {
    this.folder.set(name);
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }
}
