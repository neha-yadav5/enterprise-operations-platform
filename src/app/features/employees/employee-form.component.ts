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
import {
  DEPARTMENTS,
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
  EmployeeStatus,
  EmploymentType,
  LOCATIONS,
  fullName,
} from '../../models/employee.model';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './employee-form.component.html',
  styles: [':host { display: block; }'],
})
export class EmployeeFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EmployeeService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly departments = DEPARTMENTS;
  readonly locations = LOCATIONS;
  readonly employmentTypes = EMPLOYMENT_TYPES;
  readonly statuses = EMPLOYEE_STATUSES;

  readonly managers = this.service.employees;
  readonly submitted = signal(false);

  /** Present when the route carries an :id — this form is then an editor. */
  readonly editId = inject(ActivatedRoute).snapshot.paramMap.get('id');
  readonly isEdit = this.editId !== null;

  readonly placeholderId = this.service.nextId();

  constructor() {
    if (!this.editId) return;

    const existing = this.service.byId(this.editId);
    if (!existing) return;

    this.form.patchValue({
      firstName: existing.firstName,
      lastName: existing.lastName,
      email: existing.email,
      id: existing.id,
      title: existing.title,
      department: existing.department,
      location: existing.location,
      managerId: existing.managerId ?? '',
      employmentType: existing.employmentType,
      startDate: existing.startDate,
      status: existing.status,
    });

    // The business identifier is the record's key; changing it in place would
    // orphan every reference to it.
    this.form.controls.id.disable();
  }

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email, this.uniqueEmail.bind(this)]],
    id: ['', [this.idFormat, this.uniqueId.bind(this)]],
    title: ['', [Validators.required, Validators.maxLength(80)]],
    department: ['', Validators.required],
    location: ['', Validators.required],
    managerId: [''],
    employmentType: ['Full-time' as EmploymentType, Validators.required],
    startDate: ['', Validators.required],
    status: ['Active' as EmployeeStatus, Validators.required],
  });

  name = fullName;

  /** Optional field — blank is fine, but a value must look like EMP-1234. */
  private idFormat(control: AbstractControl): ValidationErrors | null {
    const value = (control.value as string)?.trim();
    if (!value) return null;
    return /^EMP-\d{3,6}$/.test(value) ? null : { idFormat: true };
  }

  private uniqueId(control: AbstractControl): ValidationErrors | null {
    const value = (control.value as string)?.trim();
    if (!value) return null;
    return this.service.byId(value) ? { duplicateId: true } : null;
  }

  private uniqueEmail(control: AbstractControl): ValidationErrors | null {
    const value = (control.value as string)?.trim().toLowerCase();
    if (!value) return null;
    // In edit mode the record's own email is not a clash with itself.
    const taken = this.service
      .employees()
      .some((e) => e.email.toLowerCase() === value && e.id !== this.editId);
    return taken ? { duplicateEmail: true } : null;
  }

  /** Show an error only once the user has engaged, or after a submit attempt. */
  invalid(name: string): boolean {
    const control = this.form.get(name);
    if (!control) return false;
    return control.invalid && (control.touched || this.submitted());
  }

  errorFor(name: string): string {
    const control = this.form.get(name);
    if (!control?.errors) return '';
    const errors = control.errors;

    if (errors['required']) return 'This field is required.';
    if (errors['email']) return 'Enter a valid email address.';
    if (errors['duplicateEmail']) return 'Another employee already uses this email.';
    if (errors['idFormat']) return 'Use the format EMP-1234, or leave blank to auto-assign.';
    if (errors['duplicateId']) return 'That employee ID is already taken.';
    if (errors['maxlength']) return 'That value is too long.';
    return 'Check this value.';
  }

  submit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      // Move focus to the first thing that failed so keyboard users are not
      // stranded at the bottom of the form next to a disabled-looking button.
      const firstInvalid = Object.keys(this.form.controls).find((key) => this.form.get(key)?.invalid);
      if (firstInvalid && isPlatformBrowser(this.platformId)) {
        document.getElementById(`emp-${firstInvalid}`)?.focus();
      }
      return;
    }

    const value = this.form.getRawValue();
    const fields = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim(),
      title: value.title.trim(),
      department: value.department,
      location: value.location,
      managerId: value.managerId || null,
      employmentType: value.employmentType,
      startDate: value.startDate,
      status: value.status,
    };

    if (this.editId) {
      this.service.update(this.editId, fields);
      void this.router.navigate(['/employees', this.editId]);
      return;
    }

    const created = this.service.add({ ...fields, id: value.id.trim() || undefined });
    void this.router.navigate(['/employees', created.id]);
  }
}
