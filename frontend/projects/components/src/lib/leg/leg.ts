import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Icon } from '../icon/icon';

/**
 * A travel leg between two timeline blocks — `.leg` in docs/mocks/pages/weekend.html
 * (L2-090): a dotted rail, the drive ("45 min · 52 km") and, for longer legs, a
 * "Directions" link that opens the maps provider in a new tab. The host is a list
 * item named for assistive tech ("Travel: 45 minutes, 52 kilometres to …").
 */
@Component({
  selector: 'sd-leg',
  standalone: true,
  imports: [Icon],
  templateUrl: './leg.html',
  styleUrl: './leg.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'leg',
    role: 'listitem',
    '[attr.aria-label]': 'ariaLabel() || null',
  },
})
export class Leg {
  /** "45 min · 52 km". */
  readonly label = input<string>('');
  /** "Travel: 45 minutes, 52 kilometres to Lavender fields". */
  readonly ariaLabel = input<string>('');
  /** Directions for the leg; empty hides the link. */
  readonly directionsUrl = input<string>('');
}
