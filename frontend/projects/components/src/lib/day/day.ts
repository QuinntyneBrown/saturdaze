import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';

import { Button } from '../button/button';
import { Chip } from '../chip/chip';
import { Disc, DiscTone } from '../disc/disc';
import { Icon } from '../icon/icon';

/**
 * One day of the weekend: sticky header (weather disc, name, meta, the two
 * day actions) over a list of `sd-block` rows. Mirrors `.day` in
 * docs/mocks-v2/styles/app.css. Project blocks into the default slot and
 * the "Add an errand" ghost row into `[slot=footer]`.
 */

export type DayWeather = 'sun' | 'cloud' | 'rain' | 'snow';

const WEATHER: Record<DayWeather, { icon: string; tone: DiscTone }> = {
  sun: { icon: 'sun', tone: 'sun' },
  cloud: { icon: 'cloud', tone: 'sky' },
  rain: { icon: 'rain', tone: 'sky' },
  snow: { icon: 'snow', tone: 'sky' },
};

let nextDayId = 0;

@Component({
  selector: 'sd-day',
  standalone: true,
  imports: [Button, Chip, Disc, Icon],
  templateUrl: './day.html',
  styleUrl: './day.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'day',
    '[class.day--locked]': 'locked()',
    '[attr.title]': 'dayTitle() || null',
    '[attr.weather]': 'weather()',
    '[attr.locked]': 'locked() ? "" : null',
    '[attr.aria-labelledby]': 'headingId',
  },
})
export class Day {
  readonly dayTitle = input<string>('Saturday', { alias: 'title' });
  readonly meta = input<string>('');
  readonly weather = input<DayWeather | null>(null);
  readonly locked = input(false, { transform: booleanAttribute });
  /** Show the Regenerate / Lock day buttons (off while generating, read-only). */
  readonly actions = input(true, { transform: booleanAttribute });
  /** Disable the day buttons while a request is in flight. */
  readonly busy = input(false, { transform: booleanAttribute });
  readonly regenerate = output<void>();
  readonly lockToggle = output<boolean>();

  protected readonly headingId = `sd-day-${nextDayId++}`;
  protected readonly weatherIcon = computed(() => WEATHER[this.weather() ?? 'sun'].icon);
  protected readonly weatherTone = computed(() => WEATHER[this.weather() ?? 'sun'].tone);
}
