import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import { SdButton } from '../sd-button/sd-button';
import { SdIcon } from '../sd-icon/sd-icon';

/**
 * The first moment of the experience. Mirrors
 * `docs/mocks/components/sd-hero.js`. The cream-to-coral gradient backdrop
 * sets the tone — warm, family, sun-dappled.
 */

@Component({
  selector: 'sd-hero',
  standalone: true,
  imports: [SdButton, SdIcon],
  templateUrl: './sd-hero.html',
  styleUrl: './sd-hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.greeting]': 'greeting()',
    '[attr.subtitle]': 'subtitle()',
    '[attr.cta]': 'cta()',
  },
})
export class SdHero {
  readonly greeting = input<string>('Morning, the Browns');
  readonly subtitle = input<string>(
    "Your weekend's looking good. Want me to map it out?",
  );
  readonly cta = input<string>('Plan This Weekend');
}
