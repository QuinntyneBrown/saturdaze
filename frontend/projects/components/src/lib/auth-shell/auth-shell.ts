import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Centred shell for the signed-out screens: brand lockup on top, the
 * projected auth card, the Terms · Privacy · Back footer. Mirrors `.auth` /
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
    '[attr.stack]': 'stack() ? "" : null',
  },
})
export class AuthShell {
  /** Top-aligned (several stacked cards) instead of vertically centred. */
  readonly stack = input(false, { transform: booleanAttribute });
}
