import { CoverDto } from './cover.dto';
import { DaySummaryDto } from './day-summary.dto';
import { LocationDto } from './location.dto';
import { ItineraryBlockDto } from './itinerary-block.dto';
import { ShoppingErrandDto } from './shopping-errand.dto';
import { WeatherForecastDto } from './weather-forecast.dto';

/**
 * Server-side weekend payload. Mirrors
 * `Saturdaze.Application.Contracts.WeekendDto`.
 */
export interface WeekendDto {
  /**
   * Id.
   */
  readonly id: string;
  /**
   * Weekend Of.
   */
  readonly weekendOf: string; // YYYY-MM-DD (Saturday)
  /**
   * Is Favourite.
   */
  readonly isFavourite: boolean;
  /**
   * Notes.
   */
  readonly notes: string;
  /**
   * Regenerate Count.
   */
  readonly regenerateCount: number;
  /**
   * Title — user-supplied name, `null` when unnamed.
   */
  readonly title: string | null;
  /**
   * Rating — 1..5, `null` when unrated.
   */
  readonly rating: number | null;
  /**
   * Blocks.
   */
  readonly blocks: readonly ItineraryBlockDto[];
  /**
   * Errands.
   */
  readonly errands: readonly ShoppingErrandDto[];
  /**
   * Weather.
   */
  readonly weather: readonly WeatherForecastDto[];
  /**
   * Days — stop count and driving totals per day (L2-090 AC5).
   */
  readonly days?: readonly DaySummaryDto[];
  /**
   * Home — where each day's journey starts and ends.
   */
  readonly home?: LocationDto | null;
  /**
   * Cover — the weekend's cover photo, or null for the fallback (L2-096).
   */
  readonly cover?: CoverDto | null;
}
