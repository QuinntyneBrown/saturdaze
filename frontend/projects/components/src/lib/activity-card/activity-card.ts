import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { CardMedia, Media } from '../media/media';

/**
 * An activity suggestion on Ideas. Mirrors the photo-led `.card--media` in
 * docs/mocks/pages/ideas.html (L2-094): the place's photo (or a tinted
 * fallback tile with the category icon), title, place, a two-line "why",
 * chips, and a Map link when the catalogue has one.
 */

export type ActivityCardTone = 'leaf' | 'indoor';

@Component({
  selector: 'sd-activity-card',
  standalone: true,
  imports: [Button, Icon, Media],
  templateUrl: './activity-card.html',
  styleUrl: './activity-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'card card--media',
    '[attr.title]': 'cardTitle() || null',
    '[attr.tone]': 'tone()',
  },
})
export class ActivityCard {
  readonly cardTitle = input<string>('', { alias: 'title' });
  readonly meta = input<string>('');
  readonly why = input<string>('');
  readonly icon = input<string>('tree');
  readonly tone = input<ActivityCardTone>('leaf');
  readonly mapUrl = input<string>('');
  /** The place's primary photo; null shows the fallback tile. */
  readonly media = input<CardMedia | null>(null);
}
