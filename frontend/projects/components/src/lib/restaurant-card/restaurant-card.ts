import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';

import { Chip } from '../chip/chip';
import { Icon } from '../icon/icon';

/**
 * Restaurant pick card. Mirrors `docs/mocks/components/sd-restaurant-card.js`.
 *
 * Head: tinted-fork icon + name + style/near line + meta chips (drive,
 * optional wife-approved). Votes section is a slot for `sd-vote-row` rows
 * and any footer actions.
 */

@Component({
  selector: 'sd-restaurant-card',
  standalone: true,
  imports: [Chip, Icon],
  templateUrl: './restaurant-card.html',
  styleUrl: './restaurant-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.name]': 'name()',
    '[attr.near]': 'near() || null',
    '[attr.drive]': 'drive() || null',
    '[attr.wifeapproved]': 'wifeapproved() ? "" : null',
    '[attr.icon]': 'icon()',
  },
})
export class RestaurantCard {
  readonly name = input<string>('');
  // The mock attribute name is `style`, but `[style]` collides with Angular's
  // style binding, so the input is named `styleAttr`. It is not mirrored back
  // to the DOM — no e2e assertion needs the attribute.
  readonly styleAttr = input<string>('');
  readonly near = input<string>('');
  readonly drive = input<string>('');
  readonly wifeapproved = input(false, { transform: booleanAttribute });
  readonly icon = input<string>('fork');
}
