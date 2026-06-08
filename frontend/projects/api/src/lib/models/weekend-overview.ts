import { AnticipationTip } from './anticipation-tip';
import { Block } from './block';
import { DaySummary } from './day-summary';
import { QuickAction } from './quick-action';
import { WeatherDay } from './weather-day';

/** The home-screen aggregate. */
export interface WeekendOverview {
  /**
   * Greeting.
   */
  readonly greeting: string;
  /**
   * Hero Subtitle.
   */
  readonly heroSubtitle: string;
  /**
   * Hero Cta.
   */
  readonly heroCta: string;
  /**
   * Forecast Subtitle.
   */
  readonly forecastSubtitle: string;
  /**
   * Forecast.
   */
  readonly forecast: readonly WeatherDay[];
  /**
   * Days.
   */
  readonly days: readonly DaySummary[];
  /**
   * Anticipations.
   */
  readonly anticipations: readonly AnticipationTip[];
  /**
   * Quick Actions.
   */
  readonly quickActions: readonly QuickAction[];
  /**
   * Preview.
   */
  readonly preview: readonly Block[];
}
