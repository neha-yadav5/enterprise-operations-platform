import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import { Permission, RoleId } from './permission.model';
import { DEFAULT_ROLE, ROLES } from './roles.data';

const STORAGE_KEY = 'nexusone.role';

/**
 * The single place the UI asks "may I?".
 *
 * Components check permissions, never role names — so adding a role is a data
 * change here rather than a hunt for `role === 'ADMIN'` across the codebase.
 *
 * NOT a security boundary. See permission.model.ts.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly roles = ROLES;

  private readonly roleId = signal<RoleId>(this.read());

  readonly currentRoleId = this.roleId.asReadonly();

  readonly role = computed(
    () => ROLES.find((role) => role.id === this.roleId()) ?? ROLES[0],
  );

  /** Set membership, rebuilt only when the role changes. */
  private readonly granted = computed(() => new Set<Permission>(this.role().permissions));

  readonly permissionCount = computed(() => this.granted().size);

  has(permission: Permission): boolean {
    return this.granted().has(permission);
  }

  hasAny(permissions: Permission[]): boolean {
    return permissions.some((permission) => this.granted().has(permission));
  }

  hasAll(permissions: Permission[]): boolean {
    return permissions.every((permission) => this.granted().has(permission));
  }

  /** Permission count for any role, for the Roles screen. */
  countFor(roleId: RoleId): number {
    return ROLES.find((role) => role.id === roleId)?.permissions.length ?? 0;
  }

  roleHas(roleId: RoleId, permission: Permission): boolean {
    return ROLES.find((role) => role.id === roleId)?.permissions.includes(permission) ?? false;
  }

  switchTo(roleId: RoleId): void {
    if (!ROLES.some((role) => role.id === roleId)) return;
    this.roleId.set(roleId);

    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(STORAGE_KEY, roleId);
    } catch {
      // Storage blocked: the switch still applies for this session.
    }
  }

  private read(): RoleId {
    if (!isPlatformBrowser(this.platformId)) return DEFAULT_ROLE;
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as RoleId | null;
      return stored && ROLES.some((role) => role.id === stored) ? stored : DEFAULT_ROLE;
    } catch {
      return DEFAULT_ROLE;
    }
  }
}
