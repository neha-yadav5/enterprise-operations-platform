import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { SettingsService } from './settings.service';

/**
 * Builds the document title as "<page> · <organisation>".
 *
 * Routes declare only the page name. The organisation half is appended here so
 * renaming the org in Settings updates every tab title, rather than leaving 30
 * route definitions carrying a stale brand string.
 */
@Injectable({ providedIn: 'root' })
export class OrgTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly settings = inject(SettingsService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page = this.buildTitle(snapshot);
    const org = this.settings.organisation().name;
    this.title.setTitle(page ? `${page} · ${org}` : org);
  }
}
