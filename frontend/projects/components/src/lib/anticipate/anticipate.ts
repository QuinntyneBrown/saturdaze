import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import { Button } from '../button/button';
import { Icon } from '../icon/icon';

/**
 * The "11-star" pre-emptive callout. Mirrors
 * `docs/mocks/components/sd-anticipate.js`. Surfaces something the user
 * didn't ask for but will be glad you noticed.
 */

@Component({
  selector: 'sd-anticipate',
  standalone: true,
  imports: [Button, Icon],
  templateUrl: './anticipate.html',
  styleUrl: './anticipate.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.icon]': 'icon()',
    '[attr.headline]': 'headline() || null',
    '[attr.body]': 'body() || null',
    '[attr.cta]': 'cta() || null',
  },
})
export class Anticipate {
  readonly icon = input<string>('sparkle');
  readonly headline = input<string>('');
  readonly body = input<string>('');
  readonly cta = input<string>('');
}
