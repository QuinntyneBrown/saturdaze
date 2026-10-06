import { MapPin, MapPoint } from './map-pin';
import { BlockRow } from './block-row';
import { WeatherDay } from './weather-day';
import { WeekendDay } from './weekend-day';

/**
 * Day View — one `sd-day` column: header meta, the lock state, what a
 * regenerate would keep, and the timeline rows.
 */
export interface DayView {
  /**
   * Day.
   */
  readonly day: WeekendDay;
  /**
   * Date Iso — `YYYY-MM-DD`.
   */
  readonly dateIso: string;
  /**
   * Date Label — "17 May".
   */
  readonly dateLabel: string;
  /**
   * Weather.
   */
  readonly weather: WeatherDay;
  /**
   * Meta — "17 May · 22° / 14° · Light breeze, good for outdoors".
   */
  readonly meta: string;
  /**
   * Locked — true when every lockable block on the day is locked.
   */
  readonly locked: boolean;
  /**
   * Keeping — "Swim 9:00" entries for the regenerate confirmation well.
   */
  readonly keeping: readonly string[];
  /**
   * Blocks.
   */
  readonly blocks: readonly BlockRow[];
  /**
   * Stops — numbered stops away from home, for the day map (L2-103).
   */
  readonly stops: readonly MapPin[];
  /**
   * Home — the map's home pin; null when unknown.
   */
  readonly home: MapPoint | null;
  /**
   * Driving Minutes — the sum of the day's legs (L2-102 AC5).
   */
  readonly drivingMinutes: number;
  /**
   * Driving Km — the day's total road distance.
   */
  readonly drivingKm: number;
}
