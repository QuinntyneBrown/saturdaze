import { Block } from './block';
import { WeatherDay } from './weather-day';

/** A full day in the weekend plan. */
export interface Day {
  /**
   * Date.
   */
  readonly date: string;
  /**
   * Weather.
   */
  readonly weather: WeatherDay;
  /**
   * Blocks.
   */
  readonly blocks: readonly Block[];
}
