import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';

/**
 * "Skip to content" (WCAG 2.4.1 Bypass Blocks). Mirrors `.skip-link` in
 * docs/mocks/styles/app.css: the first element of every page, off screen at
 * rest, 16px from the top left on `:focus-visible`, above every bar.
 *
 * Both apps use `<base href="/">`, so the href includes the current path and
 * query before its target fragment. The click is handled too: the target
 * (`<main id="main">` by default) gets `tabindex="-1"` and takes focus, which
 * also scrolls it into view clear of the sticky bar (`scroll-padding-top`).
 */
@Component({
  selector: 'sd-skip-link',
  standalone: true,
  template: `<a class="skip-link" [attr.href]="href()" (click)="skip($event)">{{ label() }}</a>`,
  styleUrl: './skip-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkipLink {
  /** The id of the element the link skips to. */
  readonly target = input<string>('main');
  readonly label = input<string>('Skip to content');

  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router, { optional: true });
  private readonly currentRoute = signal(this.routeFromLocation());
  protected readonly href = computed(() => `${this.currentRoute()}#${this.target()}`);

  constructor() {
    this.router?.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) this.currentRoute.set(this.routeFromLocation());
    });
  }

  private routeFromLocation(): string {
    const location = this.document.defaultView?.location;
    return `${location?.pathname ?? '/'}${location?.search ?? ''}`;
  }

  protected skip(event: Event): void {
    event.preventDefault();
    const target = this.document.getElementById(this.target());
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus();
  }
}
