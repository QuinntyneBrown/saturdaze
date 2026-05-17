import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Button, Chip, Icon, TimelineBlock } from 'components';

/**
 * Marketing splash — pages/splash.html.
 *
 * Public surface for signed-out visitors. Deliberately escapes the
 * `.sd-frame` phone canvas (the route declares `data: { chrome: false }`)
 * so the marketing layout can run edge-to-edge up to 1120px.
 */
@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [RouterLink, Button, Chip, Icon, TimelineBlock],
  templateUrl: './splash.page.html',
  styleUrl: './splash.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplashPage {}
