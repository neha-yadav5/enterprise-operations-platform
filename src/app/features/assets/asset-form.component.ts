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

import { AssetService } from '../../core/asset.service';
import { EmployeeService } from '../../core/employee.service';
import { ASSET_CATEGORIES, ASSET_STATUSES, AssetCategory, AssetStatus } from '../../models/asset.model';
import { LOCATIONS, fullName } from '../../models/employee.model';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-asset-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './asset-form.component.html',
  styles: [':host { display: block; }'],
})
export class AssetFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly assetService = inject(AssetService);
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly categories = ASSET_CATEGORIES;
  readonly statuses = ASSET_STATUSES;
  readonly locations = LOCATIONS;
  readonly people = this.employeeService.employees;
  readonly placeholderId = this.assetService.nextId();
  readonly submitted = signal(false);

  readonly editId = inject(ActivatedRoute).snapshot.paramMap.get('id');
  readonly isEdit = this.editId !== null;

  constructor() {
    if (!this.editId) return;
    const existing = this.assetService.byId(this.editId);
    if (!existing) return;

    this.form.patchValue({
      name: existing.name,
      id: existing.id,
      category: existing.category,
      serialNumber: existing.serialNumber,
      vendor: existing.vendor,
      location: existing.location,
      status: existing.status,
      assigneeId: existing.assigneeId ?? '',
      purchaseDate: existing.purchaseDate,
      purchaseCost: existing.purchaseCost,
      warrantyEnd: existing.warrantyEnd,
      notes: existing.notes,
    });
    this.form.controls.id.disable();
  }

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.maxLength(100)]],
      id: ['', [this.idFormat, this.uniqueId.bind(this)]],
      category: ['Laptop' as AssetCategory, Validators.required],
      serialNumber: ['', [Validators.required, Validators.maxLength(60)]],
      vendor: ['', [Validators.required, Validators.maxLength(60)]],
      location: ['', Validators.required],
      status: ['Available' as AssetStatus, Validators.required],
      assigneeId: [''],
      purchaseDate: ['', Validators.required],
      purchaseCost: [0, [Validators.required, Validators.min(0)]],
      warrantyEnd: ['', Validators.required],
      notes: [''],
    },
    { validators: [assigneeMatchesStatus] },
  );

  name = fullName;

  private idFormat(control: AbstractControl): ValidationErrors | null {
    const value = (control.value as string)?.trim();
    if (!value) return null;
    return /^AST-\d{3,6}$/.test(value) ? null : { idFormat: true };
  }

  private uniqueId(control: AbstractControl): ValidationErrors | null {
    const value = (control.value as string)?.trim();
    if (!value) return null;
    return this.assetService.byId(value) ? { duplicateId: true } : null;
  }

  invalid(field: string): boolean {
    const control = this.form.get(field);
    if (!control) return false;
    return control.invalid && (control.touched || this.submitted());
  }

  get assigneeMismatch(): boolean {
    return Boolean(this.form.errors?.['assigneeMismatch']) && (this.submitted() || this.form.touched);
  }

  errorFor(field: string): string {
    const errors = this.form.get(field)?.errors;
    if (!errors) return '';
    if (errors['required']) return 'This field is required.';
    if (errors['idFormat']) return 'Use the format AST-8801, or leave blank to auto-assign.';
    if (errors['duplicateId']) return 'That asset ID is already taken.';
    if (errors['maxlength']) return 'That value is too long.';
    if (errors['min']) return 'Value cannot be negative.';
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
        document.getElementById(`ast-${firstInvalid}`)?.focus();
      }
      return;
    }

    const value = this.form.getRawValue();

    if (this.editId) {
      this.assetService.update(this.editId, {
        name: value.name.trim(),
        category: value.category,
        serialNumber: value.serialNumber.trim(),
        vendor: value.vendor.trim(),
        location: value.location,
        status: value.status,
        assigneeId: value.assigneeId || null,
        purchaseDate: value.purchaseDate,
        purchaseCost: Number(value.purchaseCost),
        warrantyEnd: value.warrantyEnd,
        notes: value.notes.trim(),
      });
      void this.router.navigate(['/assets', this.editId]);
      return;
    }

    const created = this.assetService.add({
      name: value.name.trim(),
      id: value.id.trim() || undefined,
      category: value.category,
      serialNumber: value.serialNumber.trim(),
      vendor: value.vendor.trim(),
      location: value.location,
      status: value.status,
      assigneeId: value.assigneeId || null,
      purchaseDate: value.purchaseDate,
      purchaseCost: Number(value.purchaseCost),
      warrantyEnd: value.warrantyEnd,
      notes: value.notes.trim(),
    });

    void this.router.navigate(['/assets', created.id]);
  }
}

/**
 * An asset marked Assigned must name a holder, and one that is not assigned
 * must not — otherwise the roster shows a laptop belonging to nobody, or a
 * person holding something the inventory says is in stock.
 */
function assigneeMatchesStatus(group: AbstractControl): ValidationErrors | null {
  const status = group.get('status')?.value as AssetStatus;
  const assignee = group.get('assigneeId')?.value as string;
  if (status === 'Assigned' && !assignee) return { assigneeMismatch: true };
  if (status !== 'Assigned' && assignee) return { assigneeMismatch: true };
  return null;
}
