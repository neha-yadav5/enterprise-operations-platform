import { Injectable, computed, inject, signal } from '@angular/core';

import { EmployeeService } from './employee.service';
import { CURRENT_USER_ID } from './session';

export type Appearance = 'System' | 'Light' | 'Dark';

export interface UserPreferences {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  requestUpdates: boolean;
  projectUpdates: boolean;
  mentionNotifications: boolean;
  appearance: Appearance;
  language: string;
  timezone: string;
}

/** The fields a user may change about themselves. */
export interface EditableProfile {
  preferredName: string;
  phone: string;
  location: string;
}

export interface UserSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export const APPEARANCES: Appearance[] = ['System', 'Light', 'Dark'];

export const LANGUAGES = ['English (UK)', 'English (US)', 'Deutsch', 'Français', 'Português'];

/**
 * The signed-in user's own account.
 *
 * Everything here resolves from `CURRENT_USER_ID` rather than an id supplied by
 * the caller — the PRD is explicit that the profile must never be addressable
 * by an arbitrary user id, and enforcing that in the service means no component
 * can accidentally introduce the hole.
 *
 * User and Employee stay separate: the employment record is read from
 * EmployeeService and is read-only here, while preferences and the editable
 * fields belong to the user account and live in this class.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly employees = inject(EmployeeService);

  /** The employment record behind the account. Organisation-controlled. */
  readonly employee = computed(() => this.employees.byId(CURRENT_USER_ID));

  readonly manager = computed(() => {
    const employee = this.employee();
    return employee ? this.employees.managerOf(employee) : undefined;
  });

  readonly team = computed(() => this.employees.reportsTo(CURRENT_USER_ID));

  readonly editable = signal<EditableProfile>({
    preferredName: 'Elena',
    phone: '+44 20 7946 0812',
    location: 'London',
  });

  readonly preferences = signal<UserPreferences>({
    emailNotifications: true,
    inAppNotifications: true,
    requestUpdates: true,
    projectUpdates: false,
    mentionNotifications: true,
    appearance: 'System',
    language: 'English (UK)',
    timezone: 'Europe/London',
  });

  readonly sessions = signal<UserSession[]>([
    {
      id: 'SES-77410',
      device: 'Chrome on Windows',
      location: 'London, UK',
      lastActive: 'Active now',
      current: true,
    },
    {
      id: 'SES-77188',
      device: 'Safari on iPhone',
      location: 'London, UK',
      lastActive: '2 hours ago',
      current: false,
    },
    {
      id: 'SES-76902',
      device: 'Firefox on macOS',
      location: 'Berlin, DE',
      lastActive: '4 days ago',
      current: false,
    },
  ]);

  readonly otherSessionCount = computed(
    () => this.sessions().filter((session) => !session.current).length,
  );

  saveProfile(next: EditableProfile): void {
    this.editable.set({
      preferredName: next.preferredName.trim(),
      phone: next.phone.trim(),
      location: next.location,
    });
  }

  updatePreferences(patch: Partial<UserPreferences>): void {
    this.preferences.update((current) => ({ ...current, ...patch }));
  }

  revokeSession(id: string): void {
    this.sessions.update((sessions) =>
      sessions.filter((session) => session.id !== id || session.current),
    );
  }

  revokeOtherSessions(): void {
    this.sessions.update((sessions) => sessions.filter((session) => session.current));
  }
}
