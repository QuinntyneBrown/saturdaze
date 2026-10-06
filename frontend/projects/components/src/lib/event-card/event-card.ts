import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

import { Button } from '../button/button';
import { DateTile } from '../date-tile/date-tile';
import { Icon } from '../icon/icon';
import { CardMedia, Media, MediaTone } from '../media/media';

/**
 * A local event on Ideas · Events. Mirrors the event `.card` in
 * docs/mocks-v2/pages/ideas.events.html: date tile, title, place and date,
 * chips, and a Details link when the event has a URL. `muted` is the
 * user's own pending suggestion.
 */
@Component({
  selector: 'sd-event-card',
  standalone: true,
  imports: [Button, DateTile, Icon, Media],
  templateUrl: './event-card.html',
  styleUrl: './event-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'card card--media',
    '[class.card--muted]': 'muted()',
    '[attr.title]': 'cardTitle() || null',
    '[attr.date]': 'date() || null',
    '[attr.muted]': 'muted() ? "" : null',
  },
})
export class EventCard {
  readonly cardTitle = input<string>('', { alias: 'title' });
  readonly meta = input<string>('');
  /** ISO date for the tile. */
  readonly date = input<string>('');
  /** Pre-split tile parts; when given they win over `date`. */
  readonly mon = input<string>('');
  readonly day = input<string>('');
  readonly muted = input(false, { transform: booleanAttribute });
  readonly url = input<string>('');
  /** The event's primary photo; null shows the fallback tile (L2-094). */
  readonly media = input<CardMedia | null>(null);
  readonly mediaTone = input<MediaTone>('sky');
}
