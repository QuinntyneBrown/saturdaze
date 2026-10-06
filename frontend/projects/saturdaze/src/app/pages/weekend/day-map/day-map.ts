import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';

import { MapPin, MapPoint, WeekendDay, drivingLabel } from 'api';
import { Button, Icon } from 'components';

import { FRAME, mapView } from './map-view';

/**
 * The day map beside the Weekend timeline — `.planner__map` in
 * docs/mocks/pages/weekend.html (L2-091, L2-092). OpenStreetMap tiles fitted to
 * the day, a home pin, one numbered pin button per stop, and the route through
 * them. It is supplementary: every fact here is also in the timeline. A day with
 * no stops away from home says so instead.
 */
@Component({
  selector: 'app-day-map',
  standalone: true,
  imports: [Button, Icon],
  templateUrl: './day-map.html',
  styleUrl: './day-map.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayMap {
  readonly day = input.required<WeekendDay>();
  readonly stops = input<readonly MapPin[]>([]);
  readonly home = input<MapPoint | null>(null);
  readonly drivingMinutes = input(0);
  readonly drivingKm = input(0);
  /** The highlighted stop, shared with the timeline. */
  readonly active = input<number | null>(null);
  /** Show the "Open map" control (narrow layouts). */
  readonly expandable = input(false, { transform: booleanAttribute });

  /** A pin was activated (click or Enter). */
  readonly activate = output<number>();
  /** The pointer entered (n) or left (null) a pin. */
  readonly hover = output<number | null>();
  readonly openMap = output<void>();

  protected readonly frame = FRAME;
  protected readonly view = computed(() =>
    this.stops().length ? mapView(this.stops(), this.home()) : null,
  );
  protected readonly legend = computed(() => {
    const n = this.stops().length;
    const km = Math.round(this.drivingKm());
    return `${n} ${n === 1 ? 'stop' : 'stops'} · ${drivingLabel(this.drivingMinutes())} · ${km} km`;
  });

  protected tileFailed(event: Event): void {
    (event.target as HTMLElement).style.visibility = 'hidden';
  }
}
