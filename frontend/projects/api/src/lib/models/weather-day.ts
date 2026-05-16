export interface WeatherDay {
  /** Day label as the user sees it (e.g. "Saturday"). */
  readonly day: string;
  /** Icon name from the `sd-icon` set (`sun`, `cloud`, `rain`, ...). */
  readonly icon: string;
  /** High temperature, °C, as a plain string for the chip. */
  readonly hi: string;
  /** Low temperature, °C, as a plain string. */
  readonly lo: string;
  /** Free-form note shown beneath the temperatures. */
  readonly note: string;
}
