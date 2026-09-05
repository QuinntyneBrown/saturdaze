import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '../icon/icon';
import { NAV_ITEMS, NavKey } from '../shared/nav-key';

/**
 * Floating four-item primary navigation shown below 720px. Mirrors
 * `.bottom-nav` in docs/mocks-v2/styles/app.css. From 720px it is hidden and
 * `sd-top-bar` takes over. Rendered once by the app shell; `active` comes
 * from route data. The clearance rule in the stylesheet is ADR-005 — do not
 * simplify it.
 */
@Component({
  selector: 'sd-bottom-nav',
  standalone: true,
  imports: [Icon, RouterLink],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'bottom-nav',
    role: 'navigation',
    'aria-label': 'Primary',
    '[attr.active]': 'active()',
  },
})
export class BottomNav {
  readonly active = input<NavKey | null>(null);

  protected readonly items = NAV_ITEMS;
}
