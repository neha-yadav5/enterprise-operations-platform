import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EmployeeService } from '../../core/employee.service';
import { ProjectService } from '../../core/project.service';
import { DEPARTMENTS, fullName } from '../../models/employee.model';
import { PROJECT_STATUSES, ProjectStatus } from '../../models/project.model';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './project-form.component.html',
  styles: [':host { display: block; }'],
})
export class ProjectFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly departments = DEPARTMENTS;
  readonly statuses = PROJECT_STATUSES;
  readonly leads = this.employeeService.employees;
  readonly placeholderId = this.projectService.nextId();
  readonly submitted = signal(false);

  readonly editId = inject(ActivatedRoute).snapshot.paramMap.get('id');
  readonly isEdit = this.editId !== null;

  constructor() {
    if (!this.editId) return;
    const existing = this.projectService.byId(this.editId);
    if (!existing) return;

    this.form.patchValue({
      name: existing.name,
      id: existing.id,
      description: existing.description,
      department: existing.department,
      leadId: existing.leadId,
      status: existing.status,
      progress: existing.progress,
      startDate: existing.startDate,
      dueDate: existing.dueDate,
      budget: existing.budget,
    });
    this.form.controls.id.disable();
  }

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.maxLength(120)]],
      id: ['', [this.idFormat, this.uniqueId.bind(this)]],
      description: ['', [Validators.required, Validators.maxLength(400)]],
      department: ['', Validators.required],
      leadId: ['', Validators.required],
      status: ['On track' as ProjectStatus, Validators.required],
      progress: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      startDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      budget: [0, [Validators.required, Validators.min(0)]],
    },
    { validators: [datesInOrder] },
  );

  name = fullName;

  private idFormat(control: AbstractControl): ValidationErrors | null {
    const value = (control.value as string)?.trim();
    if (!value) return null;
    return /^PRJ-\d{2,6}$/.test(value) ? null : { idFormat: true };
  }

  private uniqueId(control: AbstractControl): ValidationErrors | null {
    const value = (control.value as string)?.trim();
    if (!value) return null;
    return this.projectService.byId(value) ? { duplicateId: true } : null;
  }

  invalid(name: string): boolean {
    const control = this.form.get(name);
    if (!control) return false;
    return control.invalid && (control.touched || this.submitted());
  }

  get dateOrderInvalid(): boolean {
    return Boolean(this.form.errors?.['dateOrder']) && (this.submitted() || this.form.touched);
  }

  errorFor(name: string): string {
    const errors = this.form.get(name)?.errors;
    if (!errors) return '';
    if (errors['required']) return 'This field is required.';
    if (errors['idFormat']) return 'Use the format PRJ-201, or leave blank to auto-assign.';
    if (errors['duplicateId']) return 'That project code is already taken.';
    if (errors['maxlength']) return 'That value is too long.';
    if (errors['min']) return 'Value cannot be negative.';
    if (errors['max']) return 'Progress cannot exceed 100.';
    return 'Check this value.';
  }

  submit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const firstInvalid = Object.keys(this.form.controls).find(
        (key) => this.form.get(key)?.invalid,
      );
      if (firstInvalid && isPlatformBrowser(this.platformId)) {
        document.getElementById(`prj-${firstInvalid}`)?.focus();
      }
      return;
    }

    const value = this.form.getRawValue();
    const fields = {
      name: value.name.trim(),
      description: value.description.trim(),
      department: value.department,
      leadId: value.leadId,
      status: value.status,
      progress: Number(value.progress),
      startDate: value.startDate,
      dueDate: value.dueDate,
      budget: Number(value.budget),
    };

    if (this.editId) {
      this.projectService.update(this.editId, fields);
      void this.router.navigate(['/projects', this.editId]);
      return;
    }

    const created = this.projectService.add({
      ...fields,
      id: value.id.trim() || undefined,
      spent: 0,
    });
    void this.router.navigate(['/projects', created.id]);
  }
}

/** Cross-field rule: a project cannot be due before it starts. */
function datesInOrder(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value as string;
  const due = group.get('dueDate')?.value as string;
  if (!start || !due) return null;
  return new Date(due) < new Date(start) ? { dateOrder: true } : null;
}
