import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { AuthCard } from '../auth-card/auth-card';
import { AuthShell } from '../auth-shell/auth-shell';
import { Button } from '../button/button';
import { Disc } from '../disc/disc';
import { Icon } from '../icon/icon';

/**
 * The state a signed-in non-administrator sees in Saturdaze Admin
 * (L2-111 AC1): "This account can't use Saturdaze Admin" with the signed-in
 * email and a Sign out action, and nothing else. Mirrors the `#state-gate`
 * specimen in docs/mocks/pages/admin.sign-in.html: an `sd-auth-shell`
 * around an `sd-auth-card.admin-gate`.
 */
@Component({
  selector: 'sd-admin-gate',
  standalone: true,
  imports: [AuthShell, AuthCard, Button, Disc, Icon],
  templateUrl: './admin-gate.html',
  styleUrl: './admin-gate.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.email]': 'email() || null',
  },
})
export class AdminGate {
  /** The signed-in account that is not an administrator. */
  readonly email = input<string>('');
  /** Where "Open Saturdaze" goes (the family app). */
  readonly familyAppUrl = input<string>('/');
  /** The Sign out button was pressed. */
  readonly signOut = output<void>();
}
