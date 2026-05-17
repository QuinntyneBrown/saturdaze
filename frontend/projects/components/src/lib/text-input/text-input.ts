import {
  ChangeDetectionStrategy,
  Component,
  effect,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Single-line text input. Mirrors `docs/mocks/components/sd-text-input.js`.
 * Carries an optional label above the field and an optional hint below.
 *
 * Reactive Forms / ngModel: `sd-text-input` implements `ControlValueAccessor`.
 * Existing static usage `<sd-text-input value="hello" />` continues to work —
 * the static `value` input seeds the internal state, and a later
 * `writeValue` (from a `FormControl`) overrides it.
 */

@Component({
  selector: 'sd-text-input',
  standalone: true,
  templateUrl: './text-input.html',
  styleUrl: './text-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.label]': 'label() || null',
    '[attr.value]': 'internalValue() || null',
    '[attr.placeholder]': 'placeholder() || null',
    '[attr.type]': 'type()',
    '[attr.hint]': 'hint() || null',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInput),
      multi: true,
    },
  ],
})
export class TextInput implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly value = input<string>('');
  readonly placeholder = input<string>('');
  readonly type = input<string>('text');
  readonly hint = input<string>('');

  protected readonly internalValue = signal<string>('');
  protected readonly disabled = signal<boolean>(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // Mirror the static [value] input into internal state. writeValue (from a
    // FormControl) is called *after* construction so it cleanly overrides.
    effect(() => {
      const v = this.value();
      if (v) this.internalValue.set(v);
    });
  }

  protected handleInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.internalValue.set(v);
    this.onChange(v);
  }

  protected handleBlur(): void {
    this.onTouched();
  }

  writeValue(value: string | null): void {
    this.internalValue.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
