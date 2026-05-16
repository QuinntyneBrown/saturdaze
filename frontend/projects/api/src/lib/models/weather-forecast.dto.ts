export interface WeatherForecastDto {
  readonly date: string; // YYYY-MM-DD
  readonly tags: ReadonlyArray<string>;
  readonly highCelsius: number | null;
  readonly lowCelsius: number | null;
  readonly precipitationMm: number | null;
  readonly unavailable: boolean;
}
