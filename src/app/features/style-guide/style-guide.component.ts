import { Component, computed, inject } from '@angular/core';

import { SettingsService } from '../../core/settings.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

interface Swatch {
  name: string;
  token: string;
  hex: string;
  /** Swatches light enough that the hex caption needs dark text on top. */
  light: boolean;
}

interface TypeStyle {
  name: string;
  className: string;
  meta: string;
}

interface ScaleItem {
  name: string;
  token: string;
  value: string;
}

/**
 * Visual reference for the NexusOne design system (spec 6).
 *
 * Everything here reads its value from a CSS custom property rather than a
 * hard-coded literal, so this page doubles as a regression check: if a token
 * changes in `src/styles/_tokens.scss`, this page changes with it. The hex
 * captions are the only literals, and they exist so a drift between the
 * caption and the rendered swatch is immediately visible.
 */
@Component({
  selector: 'app-style-guide',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSlideToggleModule,
  ],
  templateUrl: './style-guide.component.html',
  styleUrl: './style-guide.component.scss',
})
export class StyleGuideComponent {
  private readonly settings = inject(SettingsService);

  readonly orgName = computed(() => this.settings.organisation().name);

  readonly brandSwatches: Swatch[] = [
    { name: 'Primary', token: '--nx-color-primary', hex: '#2563EB', light: false },
    { name: 'Secondary', token: '--nx-color-secondary', hex: '#0EA5E9', light: false },
    { name: 'Success', token: '--nx-color-success', hex: '#16A34A', light: false },
    { name: 'Warning', token: '--nx-color-warning', hex: '#F59E0B', light: false },
    { name: 'Danger', token: '--nx-color-danger', hex: '#DC2626', light: false },
  ];

  readonly surfaceSwatches: Swatch[] = [
    { name: 'Background', token: '--nx-color-background', hex: '#F8FAFC', light: true },
    { name: 'Surface', token: '--nx-color-surface', hex: '#FFFFFF', light: true },
    { name: 'Border', token: '--nx-color-border', hex: '#E5E7EB', light: true },
    { name: 'Text', token: '--nx-color-text', hex: '#111827', light: false },
    { name: 'Secondary text', token: '--nx-color-text-secondary', hex: '#6B7280', light: false },
  ];

  readonly typeStyles: TypeStyle[] = [
    { name: 'Display', className: 'nx-display', meta: '30 / 36 · 700' },
    { name: 'H1', className: 'nx-h1', meta: '24 / 32 · 700' },
    { name: 'H2', className: 'nx-h2', meta: '20 / 28 · 600' },
    { name: 'H3', className: 'nx-h3', meta: '16 / 24 · 600' },
    { name: 'Body', className: 'nx-body', meta: '14 / 20 · 400' },
    { name: 'Caption', className: 'nx-caption', meta: '12 / 16 · 400' },
    { name: 'Button', className: 'nx-button-text', meta: '14 / 20 · 500' },
    { name: 'Table header', className: 'nx-table-header', meta: '12 / 16 · 600 · caps' },
  ];

  readonly spacing: ScaleItem[] = [
    { name: '1', token: '--nx-space-1', value: '4px' },
    { name: '2', token: '--nx-space-2', value: '8px' },
    { name: '3', token: '--nx-space-3', value: '12px' },
    { name: '4', token: '--nx-space-4', value: '16px' },
    { name: '6', token: '--nx-space-6', value: '24px' },
    { name: '8', token: '--nx-space-8', value: '32px' },
    { name: '12', token: '--nx-space-12', value: '48px' },
    { name: '16', token: '--nx-space-16', value: '64px' },
  ];

  readonly radii: ScaleItem[] = [
    { name: 'sm', token: '--nx-radius-sm', value: '4px' },
    { name: 'md', token: '--nx-radius-md', value: '8px' },
    { name: 'lg', token: '--nx-radius-lg', value: '12px' },
    { name: 'xl', token: '--nx-radius-xl', value: '16px' },
  ];

  readonly elevations: ScaleItem[] = [
    { name: 'Small', token: '--nx-shadow-sm', value: 'shadow-sm' },
    { name: 'Medium', token: '--nx-shadow-md', value: 'shadow-md' },
    { name: 'Large', token: '--nx-shadow-lg', value: 'shadow-lg' },
  ];

  /** `rgb(var(--token))` — resolves the token at paint time. */
  colorOf(token: string): string {
    return `rgb(var(${token}))`;
  }

  varOf(token: string): string {
    return `var(${token})`;
  }
}
