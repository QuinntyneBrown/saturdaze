import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import { SdChip } from '../sd-chip/sd-chip';
import { SdIcon } from '../sd-icon/sd-icon';

/**
 * Local events feed card. Mirrors `docs/mocks/components/sd-event-card.js`.
 * Left side is a tinted date tile (MON / DD); right side is the title +
 * venue + meta chips (drive, optional `tag`).
 */

@Component({
  selector: 'sd-event-card',
  standalone: true,
  imports: [SdChip, SdIcon],
  templateUrl: './sd-event-card.html',
  styleUrl: './sd-event-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.title]': 'cardTitle() || null',
    '[attr.venue]': 'venue() || null',
    '[attr.when]': 'whenLabel() || null',
    '[attr.drive]': 'drive() || null',
    '[attr.date-day]': 'dateDay()',
    '[attr.date-mon]': 'dateMon()',
    '[attr.tag]': 'tag() || null',
    '[attr.icon]': 'icon() || null',
  },
})
export class SdEventCard {
  readonly cardTitle = input<string>('', { alias: 'title' });
  readonly venue = input<string>('');
  readonly whenLabel = input<string>('', { alias: 'when' });
  readonly drive = input<string>('');
  readonly dateDay = input<string>('17', { alias: 'date-day' });
  readonly dateMon = input<string>('MAY', { alias: 'date-mon' });
  readonly tag = input<string>('');
  readonly icon = input<string>('');
}
