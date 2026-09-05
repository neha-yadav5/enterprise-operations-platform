import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export interface OrganisationSettings {
  name: string;
  domain: string;
  timezone: string;
  weekStart: 'Monday' | 'Sunday';
  currency: string;
}

export interface SecuritySettings {
  minPasswordLength: number;
  requireSymbols: boolean;
  mfaRequired: boolean;
  sessionTimeoutMinutes: number;
  ssoEnabled: boolean;
  ipAllowlistEnabled: boolean;
}

/**
 * Roles used to live here as a module-level boolean matrix. They now live in
 * core/permissions/roles.data.ts as granular permissions, so that this service
 * and the RBAC layer cannot disagree about what a role may do.
 */
export const TIMEZONES = [
  'Europe/London',
  'Europe/Berlin',
  'Europe/Warsaw',
  'Africa/Lagos',
  'Asia/Singapore',
  'UTC',
];

/** Image types accepted for the brand logo. */
export const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

/**
 * Cap on the raw file. A data URL is roughly a third larger than the binary,
 * and localStorage is typically 5 MB in total, so this keeps the logo well
 * clear of the quota it shares with the theme and role keys.
 */
export const LOGO_MAX_BYTES = 512 * 1024;

const ORG_KEY = 'nexusone.organisation';
const LOGO_KEY = 'nexusone.logo';

const DEFAULT_ORG: OrganisationSettings = {
  name: 'NexusOne',
  domain: 'nexusone.io',
  timezone: 'Europe/London',
  weekStart: 'Monday',
  currency: 'USD',
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Organisation profile and logo persist to localStorage; security settings
   * deliberately do not. A password policy that survives a reload but is
   * enforced nowhere would be a more convincing lie than one that resets.
   */
  readonly organisation = signal<OrganisationSettings>(this.readOrg());

  /** Data URL of the uploaded logo, or null for the default mark. */
  readonly logo = signal<string | null>(this.readLogo());

  readonly security = signal<SecuritySettings>({
    minPasswordLength: 12,
    requireSymbols: true,
    mfaRequired: false,
    sessionTimeoutMinutes: 60,
    ssoEnabled: true,
    ipAllowlistEnabled: false,
  });

  saveOrganisation(next: OrganisationSettings): void {
    this.organisation.set(next);
    this.write(ORG_KEY, JSON.stringify(next));
  }

  setLogo(dataUrl: string): void {
    this.logo.set(dataUrl);
    this.write(LOGO_KEY, dataUrl);
  }

  clearLogo(): void {
    this.logo.set(null);
    this.remove(LOGO_KEY);
  }

  updateSecurity(patch: Partial<SecuritySettings>): void {
    this.security.update((current) => ({ ...current, ...patch }));
  }

  // --- Persistence ---------------------------------------------------------

  private readOrg(): OrganisationSettings {
    const raw = this.read(ORG_KEY);
    if (!raw) return DEFAULT_ORG;
    try {
      // Spread over the default so a stored object written by an older build,
      // missing a field added since, still yields a complete record.
      return { ...DEFAULT_ORG, ...(JSON.parse(raw) as Partial<OrganisationSettings>) };
    } catch {
      return DEFAULT_ORG;
    }
  }

  private readLogo(): string | null {
    const raw = this.read(LOGO_KEY);
    return raw && raw.startsWith('data:image/') ? raw : null;
  }

  private read(key: string): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Quota exceeded or storage blocked. The value still applies for this
      // session; it just will not survive a reload.
    }
  }

  private remove(key: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing useful to do.
    }
  }
}
