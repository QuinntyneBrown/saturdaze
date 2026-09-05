import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Block, BrowserFrame, Button, Chip, Day, Icon } from 'components';

import { LANDING_SAMPLE } from './landing-sample';

/**
 * Landing — `docs/mocks-v2/pages/landing.html`. The site bar is the shell's.
 * Hero with one CTA and a live miniature of the Weekend screen (real
 * `sd-day` / `sd-block` inside `sd-browser-frame`), three "how it works"
 * steps, a short footer. No sample-weekend link, on purpose.
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, Block, BrowserFrame, Button, Chip, Day, Icon],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {
  protected readonly sample = LANDING_SAMPLE;
}
