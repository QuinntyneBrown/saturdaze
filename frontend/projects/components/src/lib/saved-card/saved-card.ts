import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
} from '@angular/core';

import { Icon } from '../icon/icon';

/**
 * One row in saved weekends. Mirrors `docs/mocks/components/sd-saved-card.js`.
 * Renders date eyebrow + title, a 5-star strip filled per `rating`, an
 * optional highlights callout, and a footer for projected buttons.
 */

@Component({
  selector: 'sd-saved-card',
  standalone: true,
  imports: [Icon],
  templateUrl: './saved-card.html',
  styleUrl: './saved-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.date]': 'date() || null',
    '[attr.title]': 'cardTitle() || null',
    '[attr.rating]': 'rating()',
    '[attr.highlights]': 'highlights() || null',
    '[attr.favourite]': 'favourite() ? "" : null',
  },
})
export class SavedCard {
  readonly date = input<string>('');
  readonly cardTitle = input<string>('', { alias: 'title' });
  readonly rating = input(0, { transform: numberAttribute });
  readonly highlights = input<string>('');
  readonly favourite = input(false, { transform: booleanAttribute });

  protected readonly stars = computed(() => {
    const filled = this.rating();
    return [0, 1, 2, 3, 4].map((i) => i < filled);
  });
}
