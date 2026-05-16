import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Two-day weather glance. Mirrors `docs/mocks/components/sd-weather-strip.js`.
 * Renders `sd-weather-day` children in a 2-column grid.
 */

@Component({
  selector: 'sd-weather-strip',
  standalone: true,
  templateUrl: './sd-weather-strip.html',
  styleUrl: './sd-weather-strip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdWeatherStrip {}
