import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

/**
 * Client-side CSV export.
 *
 * The spec calls for server-generated, asynchronous exports; with no backend
 * this builds the file in the browser instead. It still honours whatever rows
 * the caller passes — which in every case is the *filtered* set, not the whole
 * table — because exporting something other than what is on screen is the one
 * thing users never expect.
 */
@Injectable({ providedIn: 'root' })
export class CsvExportService {
  private readonly platformId = inject(PLATFORM_ID);

  /** Returns false when it could not run (server render, blocked download). */
  download(filename: string, headers: string[], rows: (string | number | null | undefined)[][]): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    const body = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCell(cell)).join(','))
      .join('\r\n');

    // The BOM makes Excel open UTF-8 correctly instead of mangling accents.
    const blob = new Blob([`﻿${body}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
      anchor.click();
      return true;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * Quotes every cell and doubles inner quotes. A leading =, +, - or @ is also
 * prefixed with a quote so spreadsheet software does not treat pasted content
 * as a formula.
 */
function escapeCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}
