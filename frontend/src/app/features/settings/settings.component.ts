import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import {
  PERMISSION_GROUPS,
  Permission,
  RoleId,
  permissionVerb,
} from '../../core/permissions/permission.model';
import { PermissionService } from '../../core/permissions/permission.service';
import {
  LOGO_MAX_BYTES,
  LOGO_TYPES,
  SettingsService,
  TIMEZONES,
} from '../../core/settings.service';
import { IconComponent } from '../../shared/icon/icon.component';

type TabId = 'organisation' | 'roles' | 'security';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './settings.component.html',
  styles: [':host { display: block; }'],
})
export class SettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(SettingsService);

  readonly tabs: { id: TabId; label: string }[] = [
    { id: 'organisation', label: 'Organisation' },
    { id: 'roles', label: 'Roles' },
    { id: 'security', label: 'Security' },
  ];

  /**
   * Seeded from route data so the sidebar's "Roles" entry lands on the roles
   * tab rather than dropping the user on Organisation to hunt for it.
   */
  readonly activeTab = signal<TabId>(
    (inject(ActivatedRoute).snapshot.data['tab'] as TabId) ?? 'organisation',
  );

  readonly timezones = TIMEZONES;
  readonly security = this.service.security;

  // --- Roles ---------------------------------------------------------------

  private readonly permissions = inject(PermissionService);

  readonly permissionGroups = PERMISSION_GROUPS;
  readonly roles = this.permissions.roles;
  readonly verb = permissionVerb;

  /** Which role's matrix is being inspected — defaults to the active one. */
  readonly inspectedRole = signal<RoleId>(this.permissions.currentRoleId());

  readonly inspected = computed(
    () => this.roles.find((role) => role.id === this.inspectedRole()) ?? this.roles[0],
  );

  readonly canManageRoles = computed(() => this.permissions.has('roles.manage'));
  readonly canEditSettings = computed(() => this.permissions.has('settings.edit'));

  selectRole(id: RoleId): void {
    this.inspectedRole.set(id);
  }

  roleHas(permission: Permission): boolean {
    return this.inspected().permissions.includes(permission);
  }

  grantedInGroup(permissions: Permission[]): number {
    return permissions.filter((permission) => this.roleHas(permission)).length;
  }

  readonly saved = signal(false);

  readonly orgForm = this.fb.nonNullable.group({
    name: [this.service.organisation().name, [Validators.required, Validators.maxLength(60)]],
    domain: [
      this.service.organisation().domain,
      [Validators.required, Validators.pattern(/^[a-z0-9.-]+\.[a-z]{2,}$/i)],
    ],
    timezone: [this.service.organisation().timezone, Validators.required],
    weekStart: [this.service.organisation().weekStart, Validators.required],
    currency: [this.service.organisation().currency, Validators.required],
  });

  readonly orgDirty = computed(() => this.orgForm.dirty);

  invalid(field: string): boolean {
    const control = this.orgForm.get(field);
    return Boolean(control && control.invalid && control.touched);
  }

  errorFor(field: string): string {
    const errors = this.orgForm.get(field)?.errors;
    if (!errors) return '';
    if (errors['required']) return 'This field is required.';
    if (errors['pattern']) return 'Enter a valid domain, such as nexusone.io.';
    if (errors['maxlength']) return 'That value is too long.';
    return 'Check this value.';
  }

  saveOrganisation(): void {
    if (this.orgForm.invalid) {
      this.orgForm.markAllAsTouched();
      return;
    }
    this.service.saveOrganisation(this.orgForm.getRawValue());
    this.orgForm.markAsPristine();
    this.saved.set(true);
  }

  discard(): void {
    this.orgForm.reset(this.service.organisation());
    this.orgForm.markAsPristine();
    this.saved.set(false);
  }

  // --- Brand logo ----------------------------------------------------------

  readonly logo = this.service.logo;
  readonly logoError = signal<string | null>(null);
  readonly maxLogoKb = Math.round(LOGO_MAX_BYTES / 1024);

  /** Accept attribute for the file input, from the same list we validate on. */
  readonly logoAccept = LOGO_TYPES.join(',');

  onLogoPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.logoError.set(null);

    if (!LOGO_TYPES.includes(file.type)) {
      this.logoError.set('Use a PNG, JPEG, SVG or WebP image.');
      input.value = '';
      return;
    }

    if (file.size > LOGO_MAX_BYTES) {
      const kb = Math.round(file.size / 1024);
      this.logoError.set(`That file is ${kb} kB. The limit is ${this.maxLogoKb} kB.`);
      input.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      this.logoError.set('That file could not be read. Try another one.');
      input.value = '';
    };

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        this.logoError.set('That file could not be read. Try another one.');
        return;
      }
      this.service.setLogo(result);
      this.saved.set(true);
      // Clear the input so picking the same file again still fires a change.
      input.value = '';
    };

    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.service.clearLogo();
    this.logoError.set(null);
  }


  // --- Security handlers ---------------------------------------------------

  onMinLength(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.service.updateSecurity({ minPasswordLength: Math.max(8, Math.min(64, value || 8)) });
  }

  onTimeout(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.service.updateSecurity({ sessionTimeoutMinutes: value });
  }

  toggleSecurity(key: 'requireSymbols' | 'mfaRequired' | 'ssoEnabled' | 'ipAllowlistEnabled'): void {
    this.service.updateSecurity({ [key]: !this.security()[key] });
  }
}
