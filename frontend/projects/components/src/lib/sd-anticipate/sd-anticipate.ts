import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import { SdButton } from '../sd-button/sd-button';
import { SdIcon } from '../sd-icon/sd-icon';

/**
 * The "11-star" pre-emptive callout. Mirrors
 * `docs/mocks/components/sd-anticipate.js`. Surfaces something the user
 * didn't ask for but will be glad you noticed.
 */

@Component({
  selector: 'sd-anticipate',
  standalone: true,
  imports: [SdButton, SdIcon],
  templateUrl: './sd-anticipate.html',
  styleUrl: './sd-anticipate.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.icon]': 'icon()',
    '[attr.headline]': 'headline() || null',
    '[attr.body]': 'body() || null',
    '[attr.cta]': 'cta() || null',
  },
})
export class SdAnticipate {
  readonly icon = input<string>('sparkle');
  readonly headline = input<string>('');
  readonly body = input<string>('');
  readonly cta = input<string>('');
}
