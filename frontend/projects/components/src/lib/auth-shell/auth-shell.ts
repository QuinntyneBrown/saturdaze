import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Centred shell for the signed-out screens: brand lockup on top, the
 * projected auth card, the Terms · Privacy · Back footer. The brand and
 * "Back to Saturdaze" lead to `homeHref`: the app root by default, the
 * marketing site when the family app passes its site URL (ADR-018). Mirrors `.auth` /
 * `.auth__col` / `.auth__brand` / `.auth__foot` in
 * docs/mocks-v2/styles/app.css.
 */
@Component({
  selector: 'sd-auth-shell',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'auth',
    '[class.auth--stack]': 'stack()',
  },
})
export class AuthShell {
  /** Top-aligned (several stacked cards) instead of vertically centred. */
  readonly stack = input(false, { transform: booleanAttribute });
  /** Where the brand and "Back to Saturdaze" lead; a plain href, so it may be another origin. */
  readonly homeHref = input('/');
}
