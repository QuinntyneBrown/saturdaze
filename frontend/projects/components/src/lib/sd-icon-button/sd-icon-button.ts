import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import { SdIcon } from '../sd-icon/sd-icon';

/**
 * Round, single-icon button. Mirrors `docs/mocks/components/sd-icon-button.js`.
 * Variants: `default`, `ghost`, `filled`.
 */

export type SdIconButtonVariant = 'default' | 'ghost' | 'filled';

@Component({
  selector: 'sd-icon-button',
  standalone: true,
  imports: [SdIcon],
  templateUrl: './sd-icon-button.html',
  styleUrl: './sd-icon-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.icon]': 'icon()',
    '[attr.label]': 'label()',
    '[attr.variant]': 'variant() === "default" ? null : variant()',
  },
})
export class SdIconButton {
  readonly icon = input<string>('more');
  readonly label = input<string>('Action');
  readonly variant = input<SdIconButtonVariant>('default');
}
