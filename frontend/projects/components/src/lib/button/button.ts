import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { Router } from '@angular/router';

import { navigateInApp } from '../shared/in-app-link';

/**
 * The one button. Mirrors `.btn` in docs/mocks-v2/styles/app.css.
 *
 * The host is `display: contents`; the inner `<button>` (or `<a>` when an
 * `href` is given) is the `.btn` element the mocks draw, so pixel parity and
 * e2e locators (`.btn--primary`, role + name) hold. `icon` makes a square
 * icon-only button and then requires a `label` for its accessible name.
 * `pressed` mirrors to `aria-pressed` for toggle buttons.
 */

export type ButtonVariant = 'primary' | 'quiet' | 'ghost' | 'danger' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'sd-button',
  standalone: true,
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.variant]': 'variant()',
    '[attr.size]': 'size() === "md" ? null : size()',
    '[attr.full]': 'full() ? "" : null',
    '[attr.icon]': 'icon() ? "" : null',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.pressed]': 'pressed() === null ? null : pressed()',
  },
})
export class Button {
  private readonly router = inject(Router, { optional: true });

  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<ButtonType>('button');
  /** Full width (`.btn--block`). */
  readonly full = input(false, { transform: booleanAttribute });
  /** Square icon-only button (`.btn--icon`); pair with `label`. */
  readonly icon = input(false, { transform: booleanAttribute });
  /** Warn-coloured text on a quiet button (Sign out). */
  readonly warnText = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Toggle state → `aria-pressed`; null leaves the attribute off. */
  readonly pressed = input<boolean | null>(null);
  /** Accessible name; required for icon-only buttons. */
  readonly label = input<string>('');
  /** Render an anchor instead; in-app paths route through the SPA. */
  readonly href = input<string>('');
  readonly target = input<string>('');
  /** Extra class(es) on the inner element (`fav-btn`, `day__btn`). */
  readonly btnClass = input<string>('');

  protected readonly classes = computed(() =>
    [
      'btn',
      `btn--${this.variant()}`,
      this.size() !== 'md' ? `btn--${this.size()}` : '',
      this.full() ? 'btn--block' : '',
      this.icon() ? 'btn--icon' : '',
      this.warnText() ? 'btn--warn-text' : '',
      this.btnClass(),
    ]
      .filter(Boolean)
      .join(' '),
  );

  protected readonly rel = computed(() => (this.target() === '_blank' ? 'noopener' : null));

  protected onAnchorClick(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      return;
    }
    if (this.router && !this.target()) navigateInApp(this.router, event, this.href());
  }
}
