import { Component, Input } from '@angular/core';

/**
 * Inline SVG icon set.
 *
 * Deliberately not the Material Icons font: that would add a blocking webfont
 * request and a flash of unstyled icons on an SSR-rendered first paint. These
 * are stroke paths on a 24x24 grid, so they inherit `currentColor` and scale
 * with the type around them.
 */
export type IconName =
  | 'grid'
  | 'users'
  | 'building'
  | 'folder'
  | 'inbox'
  | 'workflow'
  | 'laptop'
  | 'document'
  | 'bar-chart'
  | 'line-chart'
  | 'sliders'
  | 'shield'
  | 'audit'
  | 'search'
  | 'bell'
  | 'plus'
  | 'chevron-left'
  | 'calendar'
  | 'user-plus'
  | 'logo'
  | 'download'
  | 'edit'
  | 'chevron-right'
  | 'mail'
  | 'briefcase'
  | 'map-pin'
  | 'filter'
  | 'check'
  | 'close'
  | 'arrow-left'
  | 'arrow-up'
  | 'arrow-down'
  | 'trash'
  | 'bell-ring'
  | 'branch'
  | 'bolt'
  | 'log-out'
  | 'key'
  | 'monitor'
  | 'phone'
  | 'chevron-down'
  | 'palette';

const PATHS: Record<IconName, string> = {
  grid: 'M4.5 4.5h5v5h-5zM14.5 4.5h5v5h-5zM4.5 14.5h5v5h-5zM14.5 14.5h5v5h-5z',
  users:
    'M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4M15 4.1a3.5 3.5 0 0 1 0 6.8',
  building:
    'M4 20V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14M14 20V10h4a2 2 0 0 1 2 2v8M3 20h18M7 8h2M7 12h2M7 16h2M17 14h1M17 17h1',
  folder:
    'M3 7a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.6.8l1 1.4a2 2 0 0 0 1.6.8H19a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  inbox:
    'M3 13h4l1.5 2.5h7L17 13h4M3 13l2.6-6.2A2 2 0 0 1 7.4 5.5h9.2a2 2 0 0 1 1.8 1.3L21 13v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  workflow: 'M5 4h5v5H5zM14 15h5v5h-5zM7.5 9v3.5a2 2 0 0 0 2 2h7',
  laptop: 'M5 6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v9H5zM3 18h18l-1-3H4z',
  document: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4',
  'bar-chart': 'M4 20h16M7.5 20v-6M12 20V8M16.5 20v-9',
  'line-chart': 'M4 20h16M6 16l4-4 3 3 5-6',
  sliders:
    'M4 7h4M12 7h8M4 12h10M18 12h2M4 17h6M14 17h6M10 7a2 2 0 1 0 0-.01M16 12a2 2 0 1 0 0-.01M12 17a2 2 0 1 0 0-.01',
  shield: 'M12 3l7 3v5.5c0 4.2-2.9 7.6-7 8.5-4.1-.9-7-4.3-7-8.5V6z',
  audit: 'M4 6h10M4 12h10M4 18h7M16 16.5l1.8 1.8L21 15',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4',
  bell: 'M18 15V10a6 6 0 1 0-12 0v5l-1.5 2.5h15zM10 20a2 2 0 0 0 4 0',
  plus: 'M12 5v14M5 12h14',
  'chevron-left': 'M14 6l-6 6 6 6',
  calendar: 'M5 6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zM5 10h14M9 4v3M15 4v3',
  'user-plus':
    'M13 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-4A3.5 3.5 0 0 0 2 17.5V19M7.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M18 8v6M15 11h6',
  logo: 'M12 3l7 3v5.5c0 4.2-2.9 7.6-7 8.5-4.1-.9-7-4.3-7-8.5V6zM9 12l2 2 4-4',
  download: 'M12 4v10M8 11l4 3 4-3M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2',
  edit: 'M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17zM14 6l4 4',
  'chevron-right': 'M10 6l6 6-6 6',
  mail: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3.5 7.5l8.5 6 8.5-6',
  briefcase:
    'M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 7V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18',
  'map-pin': 'M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
  filter: 'M4 6h16l-6.2 7.4V19l-3.6-2v-3.6z',
  check: 'M5 12.5l4.5 4.5L19 7',
  close: 'M6 6l12 12M18 6L6 18',
  'arrow-left': 'M20 12H4M10 6l-6 6 6 6',
  'arrow-up': 'M12 20V4M6 10l6-6 6 6',
  'arrow-down': 'M12 4v16M18 14l-6 6-6-6',
  trash: 'M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M10 11v6M14 11v6',
  'bell-ring': 'M18 15V10a6 6 0 1 0-12 0v5l-1.5 2.5h15zM10 20a2 2 0 0 0 4 0M2 7a6 6 0 0 1 3-4M22 7a6 6 0 0 0-3-4',
  branch: 'M7 4v6a3 3 0 0 0 3 3h7M7 4a2 2 0 1 0 0-.01M7 20a2 2 0 1 0 0-.01M7 13v5M19 13a2 2 0 1 0 0-.01',
  bolt: 'M13 3L5 14h6l-1 7 8-11h-6z',
  'log-out': 'M15 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9M17 15l4-3-4-3M21 12H10',
  key: 'M14.5 10.5a4 4 0 1 0-3.9 4L12 16l2 2 2-2 2 2 3-3-6.6-6.6zM8 8a1 1 0 1 0 0-.01',
  monitor: 'M3 5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM9 20h6M12 16v4',
  phone: 'M6 3h3l2 5-2.5 1.5a12 12 0 0 0 5 5L15 12l5 2v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4 5.2 2 2 0 0 1 6 3',
  'chevron-down': 'M6 9l6 6 6-6',
  palette:
    'M12 3a9 9 0 1 0 0 18c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7M7.5 12a1 1 0 1 0 0-.01M9.5 8a1 1 0 1 0 0-.01M14.5 8a1 1 0 1 0 0-.01',
};

@Component({
  selector: 'nx-icon',
  standalone: true,
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path [attr.d]="path" />
    </svg>
  `,
  styles: [':host { display: inline-flex; line-height: 0; }'],
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;
  @Input() size = 20;
  @Input() strokeWidth = 1.75;

  get path(): string {
    return PATHS[this.name] ?? '';
  }
}
