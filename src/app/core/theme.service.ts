import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

export type ThemeId = 'azure' | 'indigo' | 'teal' | 'graphite' | 'midnight';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  /** Swatches shown in the picker: primary, secondary, surface. */
  swatches: [string, string, string];
  dark: boolean;
}

export const THEMES: ThemeOption[] = [
  {
    id: 'azure',
    name: 'Azure',
    description: 'The spec palette. Cool blue on slate neutrals.',
    swatches: ['#2563EB', '#0EA5E9', '#F8FAFC'],
    dark: false,
  },
  {
    id: 'indigo',
    name: 'Indigo',
    description: 'Deeper primary, warmer neutrals.',
    swatches: ['#4F46E5', '#7C3AED', '#FAFAF9'],
    dark: false,
  },
  {
    id: 'teal',
    name: 'Teal',
    description: 'Calmer and more clinical.',
    swatches: ['#0D9488', '#0891B2', '#F8FAFA'],
    dark: false,
  },
  {
    id: 'graphite',
    name: 'Graphite',
    description: 'Near-monochrome. Buttons read almost black.',
    swatches: ['#334155', '#475569', '#F8FAFC'],
    dark: false,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark surfaces, light ink.',
    swatches: ['#2563EB', '#38BDF8', '#0B1120'],
    dark: true,
  },
];

const STORAGE_KEY = 'nexusone.theme';
const DEFAULT_THEME: ThemeId = 'indigo';

/**
 * Applies a theme by stamping `data-theme` on <html>.
 *
 * The attribute lives outside Angular's hydrated DOM, so switching it is pure
 * CSS and cannot cause a hydration mismatch. index.html reads the stored value
 * in a blocking inline script before first paint, which is what stops the app
 * flashing the default theme before this service runs.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly themes = THEMES;

  private readonly current = signal<ThemeId>(this.read());

  readonly theme = this.current.asReadonly();

  readonly active = computed(
    () => THEMES.find((theme) => theme.id === this.current()) ?? THEMES[0],
  );

  constructor() {
    // Re-apply on construction so the attribute and the signal agree even if
    // the inline script was blocked or the value was written by another tab.
    this.apply(this.current());
  }

  set(id: ThemeId): void {
    this.current.set(id);
    this.apply(id);

    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Private mode or blocked storage: the theme still applies for this
      // session, it just will not be remembered. Not worth surfacing.
    }
  }

  private apply(id: ThemeId): void {
    this.document.documentElement.setAttribute('data-theme', id);
  }

  private read(): ThemeId {
    if (!isPlatformBrowser(this.platformId)) return DEFAULT_THEME;
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
      return stored && THEMES.some((theme) => theme.id === stored) ? stored : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  }
}
