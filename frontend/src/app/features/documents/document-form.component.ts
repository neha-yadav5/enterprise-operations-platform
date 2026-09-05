import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { DocumentService } from '../../core/document.service';
import { EmployeeService } from '../../core/employee.service';
import { CURRENT_USER_ID } from '../../core/session';
import {
  ACCESS_LEVELS,
  AccessLevel,
  DOCUMENT_FOLDERS,
  DOCUMENT_FORMATS,
  DOCUMENT_STATUSES,
  DocumentFormat,
  DocumentStatus,
} from '../../models/document.model';
import { fullName } from '../../models/employee.model';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './document-form.component.html',
  styles: [':host { display: block; }'],
})
export class DocumentFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly documentService = inject(DocumentService);
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly folders = DOCUMENT_FOLDERS;
  readonly formats = DOCUMENT_FORMATS;
  readonly statuses = DOCUMENT_STATUSES;
  readonly accessLevels = ACCESS_LEVELS;
  readonly people = this.employeeService.employees;
  readonly submitted = signal(false);

  /** Name of the picked file, purely to make the drop zone feel real. */
  readonly pickedFile = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    folder: ['', Validators.required],
    format: ['PDF' as DocumentFormat, Validators.required],
    ownerId: [CURRENT_USER_ID, Validators.required],
    access: ['Everyone' as AccessLevel, Validators.required],
    status: ['Draft' as DocumentStatus, Validators.required],
    tags: [''],
  });

  name = fullName;

  invalid(field: string): boolean {
    const control = this.form.get(field);
    if (!control) return false;
    return control.invalid && (control.touched || this.submitted());
  }

  errorFor(field: string): string {
    const errors = this.form.get(field)?.errors;
    if (!errors) return '';
    if (errors['required']) return 'This field is required.';
    if (errors['maxlength']) return 'That value is too long.';
    return 'Check this value.';
  }

  onFilePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.pickedFile.set(file.name);

    // Prefill the title from the filename when the user has not typed one.
    if (!this.form.controls.name.value.trim()) {
      this.form.controls.name.setValue(file.name.replace(/\.[^.]+$/, ''));
    }
  }

  submit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const firstInvalid = Object.keys(this.form.controls).find(
        (key) => this.form.get(key)?.invalid,
      );
      if (firstInvalid && isPlatformBrowser(this.platformId)) {
        document.getElementById(`doc-${firstInvalid}`)?.focus();
      }
      return;
    }

    const value = this.form.getRawValue();
    const created = this.documentService.add({
      name: value.name.trim(),
      folder: value.folder,
      format: value.format,
      ownerId: value.ownerId,
      access: value.access,
      status: value.status,
      sizeKb: 0,
      tags: value.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    });

    void this.router.navigate(['/documents', created.id]);
  }
}
