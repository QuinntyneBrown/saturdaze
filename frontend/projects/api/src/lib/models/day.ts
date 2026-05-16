import { Block } from './block';
import { WeatherDay } from './weather-day';

/** A full day in the weekend plan. */
export interface Day {
  readonly date: string;
  readonly weather: WeatherDay;
  readonly blocks: readonly Block[];
}
