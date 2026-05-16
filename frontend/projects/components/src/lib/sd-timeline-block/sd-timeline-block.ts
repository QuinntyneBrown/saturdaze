import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';

import { SdChip } from '../sd-chip/sd-chip';
import { SdIcon } from '../sd-icon/sd-icon';

/**
 * One block in a day's timeline. Mirrors
 * `docs/mocks/components/sd-timeline-block.js`.
 *
 * Tone variants drive icon colour / background. `locked` switches the rail
 * dot to forest green and the body to the accent-soft fill; a "Locked"
 * chip auto-appears. `drive="45 min"` adds a sky-toned travel chip.
 */

export type SdTimelineBlockTone =
  | 'default'
  | 'meal'
  | 'drive'
  | 'workout'
  | 'fixed'
  | 'downtime'
  | 'indoor';

@Component({
  selector: 'sd-timeline-block',
  standalone: true,
  imports: [SdChip, SdIcon],
  templateUrl: './sd-timeline-block.html',
  styleUrl: './sd-timeline-block.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.time]': 'time() || null',
    '[attr.title]': 'blockTitle() || null',
    '[attr.subtitle]': 'subtitle() || null',
    '[attr.icon]': 'icon()',
    '[attr.tone]': 'tone() === "default" ? null : tone()',
    '[attr.locked]': 'locked() ? "" : null',
    '[attr.drive]': 'drive() || null',
    '[attr.duration]': 'duration() || null',
  },
})
export class SdTimelineBlock {
  readonly time = input<string>('');
  readonly blockTitle = input<string>('', { alias: 'title' });
  readonly subtitle = input<string>('');
  readonly icon = input<string>('sparkle');
  readonly tone = input<SdTimelineBlockTone>('default');
  readonly locked = input(false, { transform: booleanAttribute });
  readonly drive = input<string>('');
  readonly duration = input<string>('');
}
