import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';

/**
 * Switch with optional label. Mirrors `docs/mocks/components/sd-toggle.js`.
 * The `checked` attribute is mirrored on the host so external CSS / e2e
 * selectors can target the on state.
 */

@Component({
  selector: 'sd-toggle',
  standalone: true,
  templateUrl: './toggle.html',
  styleUrl: './toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.label]': 'label() || null',
    '[attr.checked]': 'checked() ? "" : null',
  },
})
export class Toggle {
  readonly label = input<string>('');
  readonly checked = input(false, { transform: booleanAttribute });
}
