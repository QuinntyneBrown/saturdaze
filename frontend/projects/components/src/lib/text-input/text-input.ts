import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

/**
 * Single-line text input. Mirrors `docs/mocks/components/sd-text-input.js`.
 * Carries an optional label above the field and an optional hint below.
 */

@Component({
  selector: 'sd-text-input',
  standalone: true,
  templateUrl: './text-input.html',
  styleUrl: './text-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.label]': 'label() || null',
    '[attr.value]': 'value() || null',
    '[attr.placeholder]': 'placeholder() || null',
    '[attr.type]': 'type()',
    '[attr.hint]': 'hint() || null',
  },
})
export class TextInput {
  readonly label = input<string>('');
  readonly value = input<string>('');
  readonly placeholder = input<string>('');
  readonly type = input<string>('text');
  readonly hint = input<string>('');
}
