import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { EmployeeService } from '../../core/employee.service';
import { RequestService } from '../../core/request.service';
import { CURRENT_USER_ID } from '../../core/session';
import { fullName } from '../../models/employee.model';
import {
  MONETARY_TYPES,
  REQUEST_TYPES,
  RequestDetailField,
  RequestType,
} from '../../models/request.model';
import { IconComponent } from '../../shared/icon/icon.component';

/**
 * Which optional controls each request type asks for. Keeping this as data
 * rather than a chain of ifs means the template and the validators read from
 * the same source, so a field can never be shown but unvalidated.
 */
const FIELDS_BY_TYPE: Record<RequestType, string[]> = {
  Leave: ['leaveType', 'startDate', 'endDate', 'justification'],
  Travel: ['destination', 'startDate', 'endDate', 'justification'],
  Purchase: ['vendor', 'quantity', 'justification'],
  Expense: ['vendor', 'justification'],
  Promotion: ['justification'],
  Asset: ['justification'],
  'Software access': ['vendor', 'justification'],
};

const LABELS: Record<string, string> = {
  leaveType: 'Leave type',
  startDate: 'Start date',
  endDate: 'End date',
  destination: 'Destination',
  vendor: 'Vendor or system',
  quantity: 'Quantity',
  justification: 'Reason',
};

@Component({
  selector: 'app-request-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './request-form.component.html',
  styles: [':host { display: block; }'],
})
export class RequestFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly requestService = inject(RequestService);
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly types = REQUEST_TYPES;
  readonly people = this.employeeService.employees;
  readonly submitted = signal(false);
  readonly activeFields = signal<string[]>(FIELDS_BY_TYPE['Leave']);
  readonly needsAmount = signal(true);

  readonly form = this.fb.nonNullable.group({
    type: ['Leave' as RequestType, Validators.required],
    title: ['', [Validators.required, Validators.maxLength(120)]],
    requesterId: [CURRENT_USER_ID, Validators.required],
    amount: [0],
    leaveType: [''],
    startDate: [''],
    endDate: [''],
    destination: [''],
    vendor: [''],
    quantity: [''],
    justification: [''],
  });

  name = fullName;
  labelFor = (key: string): string => LABELS[key] ?? key;

  constructor() {
    this.applyType(this.form.controls.type.value);

    this.form.controls.type.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((type) => this.applyType(type));
  }

  /** Swaps which optional controls are required as the type changes. */
  private applyType(type: RequestType): void {
    const fields = FIELDS_BY_TYPE[type] ?? [];
    this.activeFields.set(fields);

    const monetary = MONETARY_TYPES.includes(type);
    this.needsAmount.set(monetary);

    for (const key of Object.keys(LABELS)) {
      const control = this.form.get(key);
      if (!control) continue;
      if (fields.includes(key)) {
        control.setValidators([Validators.required]);
      } else {
        control.clearValidators();
        control.setValue('');
      }
      control.updateValueAndValidity({ emitEvent: false });
    }

    const amount = this.form.controls.amount;
    amount.setValidators(monetary ? [Validators.required, Validators.min(1)] : []);
    if (!monetary) amount.setValue(0);
    amount.updateValueAndValidity({ emitEvent: false });
  }

  shows(field: string): boolean {
    return this.activeFields().includes(field);
  }

  invalid(name: string): boolean {
    const control = this.form.get(name);
    if (!control) return false;
    return control.invalid && (control.touched || this.submitted());
  }

  errorFor(name: string): string {
    const errors = this.form.get(name)?.errors;
    if (!errors) return '';
    if (errors['required']) return 'This field is required.';
    if (errors['min']) return 'Enter an amount greater than zero.';
    if (errors['maxlength']) return 'That value is too long.';
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
        document.getElementById(`rq-${firstInvalid}`)?.focus();
      }
      return;
    }

    const value = this.form.getRawValue();
    const details: RequestDetailField[] = this.activeFields()
      .map((key) => ({
        label: this.labelFor(key),
        value: String((value as Record<string, unknown>)[key] ?? '').trim(),
      }))
      .filter((field) => field.value !== '');

    const created = this.requestService.add({
      type: value.type,
      title: value.title.trim(),
      requesterId: value.requesterId,
      amount: this.needsAmount() ? Number(value.amount) : undefined,
      details,
    });

    void this.router.navigate(['/requests', created.id]);
  }
}
