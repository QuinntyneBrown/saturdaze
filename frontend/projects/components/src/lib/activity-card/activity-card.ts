import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import { Chip } from '../chip/chip';
import { Icon } from '../icon/icon';

/**
 * Activity suggestion card. Mirrors `docs/mocks/components/sd-activity-card.js`.
 * Tinted-swatch image at the top reflects the `tone`. Optional `tag` becomes
 * a corner-tag chip; `drive` + `ages` render as chips below the title; `why`
 * is a soft callout explaining the suggestion.
 */

export type ActivityCardTone = 'default' | 'outdoor' | 'indoor' | 'food';

@Component({
  selector: 'sd-activity-card',
  standalone: true,
  imports: [Chip, Icon],
  templateUrl: './activity-card.html',
  styleUrl: './activity-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.title]': 'cardTitle() || null',
    '[attr.subtitle]': 'subtitle() || null',
    '[attr.drive]': 'drive() || null',
    '[attr.why]': 'why() || null',
    '[attr.icon]': 'icon()',
    '[attr.tone]': 'tone() === "default" ? null : tone()',
    '[attr.ages]': 'ages() || null',
    '[attr.tag]': 'tag() || null',
  },
})
export class ActivityCard {
  readonly cardTitle = input<string>('', { alias: 'title' });
  readonly subtitle = input<string>('');
  readonly drive = input<string>('');
  readonly why = input<string>('');
  readonly icon = input<string>('tree');
  readonly tone = input<ActivityCardTone>('default');
  readonly ages = input<string>('');
  readonly tag = input<string>('');
}
