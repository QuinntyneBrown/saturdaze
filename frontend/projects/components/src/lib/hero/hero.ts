import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import { Button } from '../button/button';
import { Icon } from '../icon/icon';

/**
 * The first moment of the experience. Mirrors
 * `docs/mocks/components/sd-hero.js`. The cream-to-coral gradient backdrop
 * sets the tone — warm, family, sun-dappled.
 */

@Component({
  selector: 'sd-hero',
  standalone: true,
  imports: [Button, Icon],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.greeting]': 'greeting()',
    '[attr.subtitle]': 'subtitle()',
    '[attr.cta]': 'cta()',
  },
})
export class Hero {
  readonly greeting = input<string>('Morning, the Browns');
  readonly subtitle = input<string>(
    "Your weekend's looking good. Want me to map it out?",
  );
  readonly cta = input<string>('Plan This Weekend');
  readonly ctaClick = output<void>();
}
