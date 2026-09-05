import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

import { Disc, DiscTone } from '../disc/disc';

/**
 * Centred empty / first-run card. Mirrors `.empty` in
 * docs/mocks-v2/styles/app.css. `warm` is the first-run variant with the
 * brand gradient. `[slot=cta]` carries the button(s); `note` is the faint
 * line under them.
 */

let nextEmptyId = 0;

@Component({
  selector: 'sd-empty',
  standalone: true,
  imports: [Disc],
  templateUrl: './empty.html',
  styleUrl: './empty.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'empty',
    '[class.empty--warm]': 'warm()',
    '[attr.title]': 'emptyTitle() || null',
    '[attr.warm]': 'warm() ? "" : null',
    '[attr.aria-labelledby]': 'headingId',
  },
})
export class Empty {
  readonly emptyTitle = input<string>('Nothing here yet', { alias: 'title' });
  readonly body = input<string>('');
  readonly icon = input<string>('sparkle');
  readonly tone = input<DiscTone>('default');
  readonly warm = input(false, { transform: booleanAttribute });
  readonly note = input<string>('');

  protected readonly headingId = `sd-empty-${nextEmptyId++}`;
}
