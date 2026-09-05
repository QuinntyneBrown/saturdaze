import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Avatar } from '../avatar/avatar';
import { Scrolled } from '../scrolled/scrolled';
import { NAV_ITEMS, NavKey } from '../shared/nav-key';

/**
 * The sticky top bar shown from 720px: wordmark, the four primary links and
 * the account avatar. Mirrors `.topbar` in docs/mocks-v2/styles/app.css.
 * Below 720px it is hidden and `sd-bottom-nav` takes over. Rendered once by
 * the app shell; `active` comes from route data.
 */
@Component({
  selector: 'sd-top-bar',
  standalone: true,
  imports: [Avatar, RouterLink],
  hostDirectives: [Scrolled],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'topbar',
    '[attr.active]': 'active()',
  },
})
export class TopBar {
  readonly active = input<NavKey | null>(null);
  /** Signed-in email; the avatar shows its initial. */
  readonly email = input<string>('');
  /** The avatar button was pressed; the element anchors the account menu. */
  readonly accountClick = output<HTMLElement>();

  protected readonly items = NAV_ITEMS;
  protected readonly initial = computed(() => this.email() || '?');

  protected onAccount(event: MouseEvent): void {
    this.accountClick.emit(event.currentTarget as HTMLElement);
  }
}
