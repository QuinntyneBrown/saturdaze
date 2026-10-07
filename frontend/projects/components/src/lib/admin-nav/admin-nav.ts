import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Avatar } from '../avatar/avatar';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { ADMIN_NAV_ITEMS, AdminNavKey } from '../shared/admin-nav-key';

/**
 * Saturdaze Admin's chrome (ADR-014). Mirrors `.admin-nav` in
 * docs/mocks/pages/admin.*.html: a vertical side navigation from 1024px
 * (brand, the five destinations with icons, the account block at the
 * bottom) and a sticky bar below it (brand mark, the links in a horizontal
 * scroller, the avatar). Rendered once by the admin app shell; `active`
 * comes from route data and marks the link with `aria-current="page"`.
 */
@Component({
  selector: 'sd-admin-nav',
  standalone: true,
  imports: [Avatar, Button, Icon, RouterLink],
  templateUrl: './admin-nav.html',
  styleUrl: './admin-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'admin-nav',
    'aria-label': 'Admin',
    '[attr.active]': 'active()',
  },
})
export class AdminNav {
  readonly active = input<AdminNavKey | null>(null);
  /** Signed-in administrator's email; the avatar shows its initial. */
  readonly email = input<string>('');
  /** Signed-in user's profile photo; replaces the initial when set. */
  readonly avatarSrc = input<string | null>(null);
  /** The Sign out button was pressed. */
  readonly signOut = output<void>();

  protected readonly items = ADMIN_NAV_ITEMS;
}
