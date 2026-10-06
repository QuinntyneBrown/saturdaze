import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';

import { navigateInApp } from '../shared/in-app-link';
import { Tooltip, TooltipRelationship } from '../tooltip/tooltip';

/**
 * The one button. Mirrors `.btn` in docs/mocks-v2/styles/app.css.
 *
 * The host is `display: contents`; the inner `<button>` (or `<a>` when an
 * `href` is given) is the `.btn` element the mocks draw, so pixel parity and
 * e2e locators (`.btn--primary`, role + name) hold. `icon` makes a square
 * icon-only button and then requires a `label` for its accessible name.
 * `pressed` mirrors to `aria-pressed` for toggle buttons. Icon-only buttons
 * show their `label` as a hover/focus tooltip; `tooltip` overrides the text
 * (or, set to `''`, turns it off).
 */

export type ButtonVariant = 'primary' | 'quiet' | 'ghost' | 'danger' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'sd-button',
  standalone: true,
  imports: [NgTemplateOutlet, Tooltip],
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
  /** Hover/focus hint. Defaults to `label` on icon-only buttons; `''` turns it off. */
  readonly tooltip = input<string | null>(null);
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

  protected readonly tooltipText = computed(
    () => this.tooltip() ?? (this.icon() ? this.label() : ''),
  );

  /** Icon-only buttons are named by `aria-label`; the tooltip only describes text ones. */
  protected readonly tooltipRelationship = computed<TooltipRelationship>(() =>
    this.icon() ? 'label' : 'description',
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
