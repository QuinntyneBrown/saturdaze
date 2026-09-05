import { WeatherForecastDto } from '../models/weather-forecast.dto';

/**
 * Forecast → presentation helpers shared by the weekend, activity and
 * events projections. The backend tags each day (`sunny`, `warm`, `mild`,
 * `rain`, `snow`, `cold`, …); these functions turn tags into words, icons
 * and the one boolean the planner cares about: "can we be outside?".
 */

export function forecastFor(
  weather: ReadonlyArray<WeatherForecastDto>,
  iso: string,
): WeatherForecastDto | null {
  return weather.find((w) => w.date === iso) ?? null;
}

export function weatherIcon(w: WeatherForecastDto | null): string {
  if (!w || w.unavailable) return 'cloud';
  if (w.tags.includes('rain')) return 'rain';
  if (w.tags.includes('snow')) return 'snow';
  if (w.tags.includes('sunny')) return 'sun';
  return 'cloud';
}

export function weatherWord(w: WeatherForecastDto | null): string {
  if (!w || w.unavailable) return 'forecast pending';
  if (w.tags.includes('rain')) return 'rain';
  if (w.tags.includes('snow')) return 'snow';
  if (w.tags.includes('sunny')) return 'sunny';
  if (w.tags.includes('warm')) return 'warm';
  if (w.tags.includes('cold')) return 'cold';
  return 'cloudy';
}

export function weatherWordCapitalised(w: WeatherForecastDto | null): string {
  const word = weatherWord(w);
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * The adjective that fronts a day in copy: "sunny Saturday", "rainy Sunday".
 * Empty when there is no forecast, so callers can drop it cleanly.
 */
export function weatherAdjective(w: WeatherForecastDto | null): string {
  if (!w || w.unavailable) return '';
  if (w.tags.includes('rain')) return 'rainy';
  if (w.tags.includes('snow')) return 'snowy';
  if (w.tags.includes('sunny')) return 'sunny';
  if (w.tags.includes('warm')) return 'warm';
  if (w.tags.includes('cold')) return 'cold';
  return 'cloudy';
}

/** The one-line note beside the temperatures in a day header. */
export function weatherNote(w: WeatherForecastDto | null): string {
  if (!w || w.unavailable) return 'Forecast pending';
  if (w.tags.includes('rain')) return 'Rain expected, plan indoors';
  if (w.tags.includes('snow')) return 'Snow on the way, stay in';
  if (w.tags.includes('sunny') && w.tags.includes('warm')) {
    return 'Light breeze, good for outdoors';
  }
  if (w.tags.includes('sunny')) return 'Sunny, bring layers';
  if (w.tags.includes('cold')) return 'Cold day, indoor-friendly';
  return 'Variable cloud, flex the plan';
}

/** True when the day is good for outdoor plans; unknown forecasts are not. */
export function isOutdoorFriendly(w: WeatherForecastDto | null): boolean {
  if (!w || w.unavailable) return false;
  if (w.tags.includes('rain') || w.tags.includes('snow') || w.tags.includes('cold')) return false;
  return w.tags.includes('sunny') || w.tags.includes('warm') || w.tags.includes('mild');
}

/** True when the day is actively wet (rain or snow). */
export function isWetDay(w: WeatherForecastDto | null): boolean {
  if (!w || w.unavailable) return false;
  return w.tags.includes('rain') || w.tags.includes('snow');
}

/** Whole degrees, or an em dash when the forecast has no number. */
export function roundOrDash(n: number | null | undefined): string {
  if (n == null) return '—';
  return String(Math.round(n));
}
