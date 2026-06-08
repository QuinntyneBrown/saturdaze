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
   * Blocks.
   */
  readonly blocks: ReadonlyArray<ItineraryBlockDto>;
  /**
   * Errands.
   */
  readonly errands: ReadonlyArray<ShoppingErrandDto>;
  /**
   * Weather.
   */
  readonly weather: ReadonlyArray<WeatherForecastDto>;
}
