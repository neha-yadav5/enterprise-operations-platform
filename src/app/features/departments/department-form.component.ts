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

import { DepartmentService } from '../../core/department.service';
import { EmployeeService } from '../../core/employee.service';
import { slugify } from '../../models/department.model';
import { LOCATIONS, fullName } from '../../models/employee.model';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-department-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './department-form.component.html',
  styles: [':host { display: block; }'],
})
export class DepartmentFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly departmentService = inject(DepartmentService);
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly locations = LOCATIONS;
  readonly people = this.employeeService.employees;
  readonly parents = this.departmentService.departments;
  readonly submitted = signal(false);

  readonly editId = inject(ActivatedRoute).snapshot.paramMap.get('id');
  readonly isEdit = this.editId !== null;

  constructor() {
    if (!this.editId) return;
    const existing = this.departmentService.byId(this.editId);
    if (!existing) return;

    this.form.patchValue({
      name: existing.name,
      description: existing.description,
      leadId: existing.leadId,
      location: existing.location,
      parentId: existing.parentId ?? '',
      budget: existing.budget,
      capacityTarget: existing.capacityTarget,
      openRoles: existing.openRoles,
    });
  }

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60), this.uniqueName.bind(this)]],
    description: ['', [Validators.required, Validators.maxLength(300)]],
    leadId: ['', Validators.required],
    location: ['', Validators.required],
    parentId: [''],
    budget: [0, [Validators.required, Validators.min(0)]],
    capacityTarget: [1, [Validators.required, Validators.min(1)]],
    openRoles: [0, [Validators.required, Validators.min(0)]],
  });

  name = fullName;

  private uniqueName(control: AbstractControl): ValidationErrors | null {
    const value = (control.value as string)?.trim();
    if (!value) return null;
    const slug = slugify(value);
    // Editing a department without renaming it is not a duplicate.
    if (slug === this.editId) return null;
    return this.departmentService.byId(slug) ? { duplicateName: true } : null;
  }

  invalid(field: string): boolean {
    const control = this.form.get(field);
    if (!control) return false;
    return control.invalid && (control.touched || this.submitted());
  }

  errorFor(field: string): string {
    const errors = this.form.get(field)?.errors;
    if (!errors) return '';
    if (errors['required']) return 'This field is required.';
    if (errors['duplicateName']) return 'A department with that name already exists.';
    if (errors['maxlength']) return 'That value is too long.';
    if (errors['min']) return 'Value is below the allowed minimum.';
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
        document.getElementById(`dep-${firstInvalid}`)?.focus();
      }
      return;
    }

    const value = this.form.getRawValue();
    const fields = {
      name: value.name.trim(),
      description: value.description.trim(),
      leadId: value.leadId,
      location: value.location,
      parentId: value.parentId || null,
      budget: Number(value.budget),
      capacityTarget: Number(value.capacityTarget),
      openRoles: Number(value.openRoles),
    };

    if (this.editId) {
      this.departmentService.update(this.editId, fields);
      void this.router.navigate(['/departments', this.editId]);
      return;
    }

    const created = this.departmentService.add(fields);
    void this.router.navigate(['/departments', created.id]);
  }
}
