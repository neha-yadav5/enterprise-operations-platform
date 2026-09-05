import { DatePipe, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AssetService } from '../../core/asset.service';
import { DocumentService } from '../../core/document.service';
import {
  APPEARANCES,
  Appearance,
  LANGUAGES,
  ProfileService,
  UserPreferences,
  UserSession,
} from '../../core/profile.service';
import { ProjectService } from '../../core/project.service';
import { RequestService } from '../../core/request.service';
import { CURRENT_USER_ID } from '../../core/session';
import { SettingsService, TIMEZONES } from '../../core/settings.service';
import { AssetStatus } from '../../models/asset.model';
import { LOCATIONS, fullName, initials } from '../../models/employee.model';
import { ProjectStatus } from '../../models/project.model';
import { RequestState } from '../../models/request.model';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { ProgressBarComponent } from '../../shared/progress-bar/progress-bar.component';
import { BadgeTone, StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

type TabId = 'overview' | 'work' | 'preferences' | 'security';

interface ActivityEntry {
  action: string;
  target: string;
  when: string;
  link: string[] | null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    IconComponent,
    AvatarComponent,
    StatusBadgeComponent,
    ProgressBarComponent,
  ],
  templateUrl: './profile.component.html',
  styles: [':host { display: block; }'],
})
export class ProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profile = inject(ProfileService);
  private readonly projects = inject(ProjectService);
  private readonly requests = inject(RequestService);
  private readonly documents = inject(DocumentService);
  private readonly assets = inject(AssetService);

  readonly tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'work', label: 'My work' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'security', label: 'Security' },
  ];

  readonly activeTab = signal<TabId>('overview');

  readonly locations = LOCATIONS;
  readonly appearances = APPEARANCES;
  readonly languages = LANGUAGES;
  readonly timezones = TIMEZONES;

  readonly employee = this.profile.employee;
  readonly manager = this.profile.manager;
  readonly team = this.profile.team;
  readonly editable = this.profile.editable;
  readonly preferences = this.profile.preferences;
  readonly sessions = this.profile.sessions;
  readonly otherSessionCount = this.profile.otherSessionCount;

  readonly editing = signal(false);
  readonly toast = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    preferredName: [this.editable().preferredName, [Validators.required, Validators.maxLength(40)]],
    phone: [this.editable().phone, [Validators.required, Validators.maxLength(30)]],
    location: [this.editable().location, Validators.required],
  });

  // --- My work -------------------------------------------------------------

  readonly myProjects = computed(() => this.projects.forEmployee(CURRENT_USER_ID));
  readonly myRequests = computed(() => this.requests.forEmployee(CURRENT_USER_ID));
  readonly myAssets = computed(() => this.assets.forEmployee(CURRENT_USER_ID));
  readonly myDocuments = computed(() =>
    this.documents.documents().filter((document) => document.ownerId === CURRENT_USER_ID),
  );

  /**
   * Operational history in the user's own voice — deliberately not the audit
   * trail, which is structured for compliance rather than for reading.
   */
  readonly activity: ActivityEntry[] = [
    {
      action: 'You changed a role permission',
      target: 'IT Admin can now access Settings',
      when: 'Today, 08:41',
      link: ['/roles'],
    },
    {
      action: 'You published a workflow',
      target: 'Promotion review — now active',
      when: 'Yesterday, 14:44',
      link: ['/workflow', 'WFL-14'],
    },
    {
      action: 'You changed organisation settings',
      target: 'Session timeout reduced to 1 hour',
      when: '3 Sep, 18:42',
      link: ['/settings'],
    },
    {
      action: 'You approved a request',
      target: 'Berlin office visit — relocation planning',
      when: '29 Aug, 14:12',
      link: ['/requests', 'REQ-4812'],
    },
    {
      action: 'You created a project',
      target: 'Workspace Relocation — Berlin',
      when: '1 Sep, 17:11',
      link: ['/projects', 'PRJ-225'],
    },
  ];

  name = fullName;
  initialsOf = initials;

  readonly displayName = computed(() => {
    const employee = this.employee();
    return employee ? fullName(employee) : 'Unknown user';
  });

  readonly avatarInitials = computed(() => {
    const employee = this.employee();
    return employee ? initials(employee) : '—';
  });

  // --- Tones ---------------------------------------------------------------

  employeeTone(status: string): BadgeTone {
    if (status === 'Active') return 'success';
    if (status === 'On leave') return 'warning';
    return 'neutral';
  }

  projectTone(status: ProjectStatus): BadgeTone {
    switch (status) {
      case 'On track':
        return 'success';
      case 'At risk':
        return 'warning';
      case 'Blocked':
        return 'danger';
      default:
        return 'info';
    }
  }

  requestTone(state: RequestState): BadgeTone {
    switch (state) {
      case 'Approved':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Rejected':
        return 'danger';
      default:
        return 'info';
    }
  }

  assetTone(status: AssetStatus): BadgeTone {
    switch (status) {
      case 'Assigned':
        return 'success';
      case 'Available':
        return 'info';
      case 'In repair':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  currentStage(requestId: string): string {
    const request = this.requests.byId(requestId);
    const step = request?.steps.find((s) => s.state === 'Current');
    return step ? step.name : 'Complete';
  }

  // --- Editing -------------------------------------------------------------

  startEdit(): void {
    this.form.reset(this.editable());
    this.editing.set(true);
    this.toast.set(null);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.form.reset(this.editable());
  }

  invalid(field: string): boolean {
    const control = this.form.get(field);
    return Boolean(control && control.invalid && control.touched);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.profile.saveProfile(this.form.getRawValue());
    this.editing.set(false);
    this.toast.set('Profile updated successfully.');
  }

  dismissToast(): void {
    this.toast.set(null);
  }

  // --- Preferences ---------------------------------------------------------

  togglePreference(
    key: 'emailNotifications' | 'inAppNotifications' | 'requestUpdates' | 'projectUpdates' | 'mentionNotifications',
  ): void {
    this.profile.updatePreferences({ [key]: !this.preferences()[key] } as Partial<UserPreferences>);
  }

  setAppearance(value: Appearance): void {
    this.profile.updatePreferences({ appearance: value });
  }

  onLanguage(event: Event): void {
    this.profile.updatePreferences({ language: (event.target as HTMLSelectElement).value });
  }

  onTimezone(event: Event): void {
    this.profile.updatePreferences({ timezone: (event.target as HTMLSelectElement).value });
  }

  // --- Security ------------------------------------------------------------

  revoke(session: UserSession): void {
    this.profile.revokeSession(session.id);
  }

  // --- Change password -----------------------------------------------------

  private readonly settings = inject(SettingsService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly passwordFirstField = viewChild<ElementRef<HTMLInputElement>>('passwordFirst');

  /** The org policy this form has to satisfy — read, not duplicated. */
  readonly policy = this.settings.security;

  readonly passwordOpen = signal(false);

  readonly passwordForm = this.fb.nonNullable.group(
    {
      current: ['', Validators.required],
      next: ['', [Validators.required]],
      confirm: ['', Validators.required],
    },
    { validators: [passwordsMatch, passwordIsNew] },
  );

  constructor() {
    // Validators depend on the live org policy, so they are rebuilt whenever it
    // changes rather than snapshotted when the component was created.
    effect(() => {
      const policy = this.policy();
      const rules = [Validators.required, Validators.minLength(policy.minPasswordLength)];
      if (policy.requireSymbols) rules.push(symbolsAndDigits);
      this.passwordForm.controls.next.setValidators(rules);
      this.passwordForm.controls.next.updateValueAndValidity({ emitEvent: false });
    });

    effect(() => {
      if (!this.passwordOpen() || !isPlatformBrowser(this.platformId)) return;
      queueMicrotask(() => this.passwordFirstField()?.nativeElement.focus());
    });
  }

  openPasswordDialog(): void {
    this.passwordForm.reset({ current: '', next: '', confirm: '' });
    this.passwordOpen.set(true);
  }

  closePasswordDialog(): void {
    this.passwordOpen.set(false);
  }

  onPasswordKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.closePasswordDialog();
    }
  }

  passwordInvalid(field: string): boolean {
    const control = this.passwordForm.get(field);
    return Boolean(control && control.invalid && control.touched);
  }

  passwordError(field: string): string {
    const errors = this.passwordForm.get(field)?.errors;
    if (!errors) return '';
    if (errors['required']) return 'This field is required.';
    if (errors['minlength']) {
      return `Use at least ${this.policy().minPasswordLength} characters.`;
    }
    if (errors['symbols']) return 'Include at least one number and one symbol.';
    return 'Check this value.';
  }

  get passwordFormError(): string {
    if (!this.passwordForm.touched && !this.passwordForm.dirty) return '';
    if (this.passwordForm.errors?.['mismatch']) return 'The two new passwords do not match.';
    if (this.passwordForm.errors?.['reused']) return 'The new password must differ from the current one.';
    return '';
  }

  submitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    // No auth backend exists yet, so nothing is sent. The form validates for
    // real against the organisation policy; the copy in the dialog says so.
    this.passwordOpen.set(false);
    this.toast.set('Password rules satisfied — not saved, no auth backend yet.');
  }

  revokeOthers(): void {
    this.profile.revokeOtherSessions();
    this.toast.set('Signed out of all other sessions.');
  }
}

/** At least one digit and one non-alphanumeric character. */
function symbolsAndDigits(control: AbstractControl): ValidationErrors | null {
  const value = (control.value as string) ?? '';
  if (!value) return null;
  const ok = /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
  return ok ? null : { symbols: true };
}

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const next = group.get('next')?.value as string;
  const confirm = group.get('confirm')?.value as string;
  if (!next || !confirm) return null;
  return next === confirm ? null : { mismatch: true };
}

function passwordIsNew(group: AbstractControl): ValidationErrors | null {
  const current = group.get('current')?.value as string;
  const next = group.get('next')?.value as string;
  if (!current || !next) return null;
  return current === next ? { reused: true } : null;
}
