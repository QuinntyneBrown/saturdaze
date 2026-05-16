import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import { Icon } from '../icon/icon';

/**
 * One-day card inside the weather strip. Mirrors
 * `docs/mocks/components/sd-weather-strip.js` (the `WeatherDay` half).
 */

@Component({
  selector: 'sd-weather-day',
  standalone: true,
  imports: [Icon],
  templateUrl: './weather-day.html',
  styleUrl: './weather-day.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.day]': 'day()',
    '[attr.icon]': 'icon()',
    '[attr.hi]': 'hi()',
    '[attr.lo]': 'lo()',
    '[attr.note]': 'note() || null',
  },
})
export class WeatherDay {
  readonly day = input<string>('Sat');
  readonly icon = input<string>('sun');
  readonly hi = input<string>('22');
  readonly lo = input<string>('14');
  readonly note = input<string>('');
}
