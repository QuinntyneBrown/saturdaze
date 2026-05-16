import { AnticipationTip } from './anticipation-tip';
import { Block } from './block';
import { DaySummary } from './day-summary';
import { QuickAction } from './quick-action';
import { WeatherDay } from './weather-day';

/** The home-screen aggregate. */
export interface WeekendOverview {
  readonly greeting: string;
  readonly heroSubtitle: string;
  readonly heroCta: string;
  readonly forecastSubtitle: string;
  readonly forecast: readonly WeatherDay[];
  readonly days: readonly DaySummary[];
  readonly anticipations: readonly AnticipationTip[];
  readonly quickActions: readonly QuickAction[];
  readonly preview: readonly Block[];
}
