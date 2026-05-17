import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { Router } from '@angular/router';

import { Icon } from '../icon/icon';

/**
 * Compact preview for one day on the home screen. Mirrors
 * `docs/mocks/components/sd-day-card.js`.
 *
 * The card behaves as a link. The href is a real Angular route so new-tab,
 * copy-link, and direct opens work exactly like the SPA click.
 */

@Component({
  selector: 'sd-day-card',
  standalone: true,
  imports: [Icon],
  templateUrl: './day-card.html',
  styleUrl: './day-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.day]': 'day()',
    '[attr.date]': 'date() || null',
    '[attr.weather]': 'weather() || null',
    '[attr.icon]': 'icon()',
    '[attr.highlight]': 'highlight() || null',
    '[attr.href]': 'href()',
  },
})
export class DayCard {
  readonly day = input<string>('Saturday');
  readonly date = input<string>('');
  readonly weather = input<string>('');
  readonly icon = input<string>('sun');
  readonly highlight = input<string>('');
  readonly href = input<string>('/itinerary');
  readonly route = input<string>('/itinerary');

  private readonly router = inject(Router);

  protected onNavigate(event: MouseEvent): void {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void this.router.navigateByUrl(this.route());
  }
}
