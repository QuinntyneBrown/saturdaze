import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import { Icon } from '../icon/icon';

/**
 * Round, single-icon button. Mirrors `docs/mocks/components/sd-icon-button.js`.
 * Variants: `default`, `ghost`, `filled`.
 */

export type IconButtonVariant = 'default' | 'ghost' | 'filled';

@Component({
  selector: 'sd-icon-button',
  standalone: true,
  imports: [Icon],
  templateUrl: './icon-button.html',
  styleUrl: './icon-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.icon]': 'icon()',
    '[attr.label]': 'label()',
    '[attr.variant]': 'variant() === "default" ? null : variant()',
  },
})
export class IconButton {
  readonly icon = input<string>('more');
  readonly label = input<string>('Action');
  readonly variant = input<IconButtonVariant>('default');
}
