import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Button } from '../button/button';
import { Disc } from '../disc/disc';
import { Icon } from '../icon/icon';

/**
 * An activity suggestion on Ideas. Mirrors the activity `.card` in
 * docs/mocks-v2/pages/ideas.html: tinted disc, title, place, a two-line
 * "why", chips, and a Map link when the catalogue has one. Cards are
 * informational — the API has no "add to day" (see the plan).
 */

export type ActivityCardTone = 'leaf' | 'indoor';

@Component({
  selector: 'sd-activity-card',
  standalone: true,
  imports: [Button, Disc, Icon],
  templateUrl: './activity-card.html',
  styleUrl: './activity-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'card',
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
}
