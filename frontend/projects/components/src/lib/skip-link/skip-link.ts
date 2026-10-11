import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

/**
 * "Skip to content" (WCAG 2.4.1 Bypass Blocks). Mirrors `.skip-link` in
 * docs/mocks/styles/app.css: the first element of every page, off screen at
 * rest, 16px from the top left on `:focus-visible`, above every bar.
 *
 * Both apps use `<base href="/">`, so a bare `href="#main"` would resolve to
 * `/#main` and leave the route. The click is handled instead: the target
 * (`<main id="main">` by default) gets `tabindex="-1"` and takes focus, which
 * also scrolls it into view clear of the sticky bar (`scroll-padding-top`).
 */
@Component({
  selector: 'sd-skip-link',
  standalone: true,
  template: `<a class="skip-link" [attr.href]="'#' + target()" (click)="skip($event)">{{
    label()
  }}</a>`,
  styleUrl: './skip-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkipLink {
  /** The id of the element the link skips to. */
  readonly target = input<string>('main');
  readonly label = input<string>('Skip to content');

  private readonly document = inject(DOCUMENT);

  protected skip(event: Event): void {
    event.preventDefault(); // never follow the href: it resolves against <base href>
    const target = this.document.getElementById(this.target());
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus();
  }
}
