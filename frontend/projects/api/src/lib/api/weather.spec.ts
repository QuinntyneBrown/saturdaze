import { WeatherForecastDto } from '../models/weather-forecast.dto';
import {
  forecastFor,
  isOutdoorFriendly,
  isWetDay,
  roundOrDash,
  weatherIcon,
  weatherNote,
  weatherWord,
  weatherWordCapitalised,
} from './weather';

function forecast(tags: string[], extra: Partial<WeatherForecastDto> = {}): WeatherForecastDto {
  return {
    date: '2026-05-16',
    tags,
    highCelsius: 22,
    lowCelsius: 14,
    precipitationMm: 0,
    unavailable: false,
    ...extra,
  };
}

describe('weather helpers', () => {
  it('finds the forecast for a date', () => {
    const sat = forecast(['sunny']);
    expect(forecastFor([sat], '2026-05-16')).toBe(sat);
    expect(forecastFor([sat], '2026-05-17')).toBeNull();
  });

  it('maps tags to icons and words', () => {
    expect(weatherIcon(forecast(['rain']))).toBe('rain');
    expect(weatherIcon(forecast(['snow']))).toBe('snow');
    expect(weatherIcon(forecast(['sunny', 'warm']))).toBe('sun');
    expect(weatherIcon(null)).toBe('cloud');
    expect(weatherWord(forecast(['sunny']))).toBe('sunny');
    expect(weatherWord(forecast(['cold']))).toBe('cold');
    expect(weatherWord(forecast([]))).toBe('cloudy');
    expect(weatherWord(forecast([], { unavailable: true }))).toBe('forecast pending');
    expect(weatherWordCapitalised(forecast(['rain']))).toBe('Rain');
  });

  it('writes a note per forecast', () => {
    expect(weatherNote(forecast(['rain']))).toMatch(/indoors/);
    expect(weatherNote(forecast(['sunny', 'warm']))).toMatch(/outdoors/);
    expect(weatherNote(forecast([], { unavailable: true }))).toMatch(/unavailable/);
  });

  it('decides whether a day is outdoor-friendly or wet', () => {
    expect(isOutdoorFriendly(forecast(['sunny']))).toBe(true);
    expect(isOutdoorFriendly(forecast(['mild']))).toBe(true);
    expect(isOutdoorFriendly(forecast(['sunny', 'cold']))).toBe(false);
    expect(isOutdoorFriendly(forecast(['rain']))).toBe(false);
    expect(isOutdoorFriendly(null)).toBe(false);
    expect(isWetDay(forecast(['rain']))).toBe(true);
    expect(isWetDay(forecast(['snow']))).toBe(true);
    expect(isWetDay(forecast(['sunny']))).toBe(false);
    expect(isWetDay(null)).toBe(false);
  });

  it('rounds temperatures or shows a dash', () => {
    expect(roundOrDash(21.6)).toBe('22');
    expect(roundOrDash(null)).toBe('—');
    expect(roundOrDash(undefined)).toBe('—');
  });
});
