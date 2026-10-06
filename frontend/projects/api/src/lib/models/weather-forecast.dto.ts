/**
 * Weather Forecast Dto.
 */
export interface WeatherForecastDto {
  /**
   * Date.
   */
  readonly date: string; // YYYY-MM-DD
  /**
   * Tags.
   */
  readonly tags: readonly string[];
  /**
   * High Celsius.
   */
  readonly highCelsius: number | null;
  /**
   * Low Celsius.
   */
  readonly lowCelsius: number | null;
  /**
   * Precipitation Mm.
   */
  readonly precipitationMm: number | null;
  /**
   * Unavailable.
   */
  readonly unavailable: boolean;
}
