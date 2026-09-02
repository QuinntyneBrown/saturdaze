import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';

import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { Stars } from '../stars/stars';

/**
 * A past weekend on the Past screen. Mirrors the `.card` in
 * docs/mocks-v2/pages/past.html: date eyebrow with the favourite heart,
 * the title as a rename button, the rating as a rate button, two-line
 * highlights, and Remix / Repeat.
 */
@Component({
  selector: 'sd-past-card',
  standalone: true,
  imports: [Button, Icon, Stars],
  templateUrl: './past-card.html',
  styleUrl: './past-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'card',
    '[attr.title]': 'cardTitle() || null',
    '[attr.rating]': 'rating() ?? null',
    '[attr.favourite]': 'favourite() ? "" : null',
  },
})
export class PastCard {
  readonly cardTitle = input<string>('', { alias: 'title' });
  /** "10 – 11 May 2026". */
  readonly dateRange = input<string>('');
  readonly rating = input<number | null>(null);
  readonly favourite = input(false, { transform: booleanAttribute });
  readonly highlights = input<string>('');
  readonly favouriteToggle = output<boolean>();
  readonly rename = output<void>();
  readonly rate = output<void>();
  readonly remix = output<void>();
  readonly repeat = output<void>();

  protected readonly ratingLabel = computed(() => {
    const r = this.rating();
    return r ? `${r} of 5` : 'Rate it';
  });

  protected readonly rateLabel = computed(() => {
    const r = this.rating();
    return r ? `Rate this weekend, currently ${r} of 5` : 'Rate this weekend';
  });
}
