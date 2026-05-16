import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';

/**
 * The one button. Used everywhere. Variant + size knobs plus an explicit
 * `full` attribute for full-width contexts. Iconography lands via the
 * leading / trailing slots; default slot is the label.
 *
 * Mirrors `docs/mocks/components/sd-button.js`.
 */

export type SdButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type SdButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'sd-button',
  standalone: true,
  templateUrl: './sd-button.html',
  styleUrl: './sd-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.variant]': 'variant() === "primary" ? null : variant()',
    '[attr.size]': 'size() === "md" ? null : size()',
    '[attr.full]': 'full() ? "" : null',
    '[attr.disabled]': 'disabled() ? "" : null',
  },
})
export class SdButton {
  readonly variant = input<SdButtonVariant>('primary');
  readonly size = input<SdButtonSize>('md');
  readonly full = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
}
