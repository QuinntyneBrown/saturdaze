import { ItineraryBlockDto } from './itinerary-block.dto';
import { ShoppingErrandDto } from './shopping-errand.dto';
import { WeatherForecastDto } from './weather-forecast.dto';

/**
 * Server-side weekend payload. Mirrors
 * `Saturdaze.Application.Contracts.WeekendDto`.
 */
export interface WeekendDto {
  readonly id: string;
  readonly weekendOf: string; // YYYY-MM-DD (Saturday)
  readonly isFavourite: boolean;
  readonly notes: string;
  readonly regenerateCount: number;
  readonly blocks: ReadonlyArray<ItineraryBlockDto>;
  readonly errands: ReadonlyArray<ShoppingErrandDto>;
  readonly weather: ReadonlyArray<WeatherForecastDto>;
}
