import {
  Directive,
  ElementRef,
  Input,
  Renderer2,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
} from '@angular/core';

import { PermissionService } from '../../core/permissions/permission.service';
import { Permission } from '../../core/permissions/permission.model';

/** What to do with the host element when permission is denied. */
export type DeniedBehaviour = 'hide' | 'disable';

/**
 * Shows content only when the current role holds the permission.
 *
 * Works two ways, and picks the right one automatically:
 *
 * 1. Structural — the element is never created at all.
 *
 *      <button *hasPermission="'projects.edit'">Edit</button>
 *      <a *hasPermission="['audit.view', 'audit.export']">Audit</a>
 *
 * 2. Attribute — the element exists and is hidden, or left visible but
 *    disabled. Use this when the host has bindings the parent already holds a
 *    reference to, or when a greyed-out control communicates more than an
 *    absent one.
 *
 *      <button [hasPermission]="['requests.approve', 'requests.reject']">Decide</button>
 *      <button [hasPermission]="'assets.edit'" hasPermissionMode="disable">Edit</button>
 *
 * An array is an ANY check — one match is enough.
 *
 * Prefer the structural form. Hiding is not security either way (the real
 * boundary is the API), but not rendering a control is harder to re-enable
 * from devtools than flipping `disabled`.
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  /** Absent when used as a plain attribute rather than with `*`. */
  private readonly template = inject<TemplateRef<unknown> | null>(TemplateRef, { optional: true });
  private readonly container = inject(ViewContainerRef);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly permissions = inject(PermissionService);

  private required: Permission[] = [];
  private mode: DeniedBehaviour = 'hide';
  private rendered = false;

  @Input({ required: true }) set hasPermission(value: Permission | Permission[]) {
    this.required = Array.isArray(value) ? value : [value];
    this.sync();
  }

  /**
   * `hide` (default) or `disable`. Named `hasPermissionMode` so it also works
   * in the microsyntax: `*hasPermission="perms; mode: 'disable'"`.
   */
  @Input() set hasPermissionMode(value: DeniedBehaviour) {
    this.mode = value;
    this.sync();
  }

  constructor() {
    effect(() => {
      // Read the role so this re-runs whenever it changes.
      this.permissions.currentRoleId();
      this.sync();
    });
  }

  private sync(): void {
    const allowed = this.required.length === 0 || this.permissions.hasAny(this.required);

    if (this.template) {
      this.syncTemplate(allowed);
      return;
    }

    this.syncHost(allowed);
  }

  /** Structural: create or destroy the embedded view. */
  private syncTemplate(allowed: boolean): void {
    if (allowed && !this.rendered) {
      this.container.createEmbeddedView(this.template!);
      this.rendered = true;
    } else if (!allowed && this.rendered) {
      this.container.clear();
      this.rendered = false;
    }
  }

  /**
   * Attribute: the element is already in the DOM, so hide or disable it.
   *
   * Hiding sets `display: none` inline rather than the `hidden` attribute —
   * `hidden` only carries a user-agent `display: none`, which any utility
   * class setting `display: flex` would beat.
   */
  private syncHost(allowed: boolean): void {
    const element = this.host.nativeElement;
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return;

    if (this.mode === 'disable') {
      if (allowed) {
        this.renderer.removeAttribute(element, 'disabled');
        this.renderer.removeAttribute(element, 'aria-disabled');
      } else {
        this.renderer.setAttribute(element, 'disabled', 'true');
        this.renderer.setAttribute(element, 'aria-disabled', 'true');
      }
      return;
    }

    if (allowed) {
      this.renderer.removeStyle(element, 'display');
    } else {
      this.renderer.setStyle(element, 'display', 'none');
    }
  }
}
