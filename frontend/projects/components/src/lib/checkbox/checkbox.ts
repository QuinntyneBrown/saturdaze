import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Native checkbox with its label as the default slot (so the label can
 * carry links: "I agree to the Terms and Privacy Policy"). Mirrors `.check`.
 */
@Component({
  selector: 'sd-checkbox',
  standalone: true,
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.checked]': 'checked() ? "" : null',
    '[attr.required]': 'required() ? "" : null',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Checkbox),
      multi: true,
    },
  ],
})
export class Checkbox implements ControlValueAccessor {
  readonly required = input(false, { transform: booleanAttribute });
  readonly name = input<string>('');

  protected readonly checked = signal<boolean>(false);
  protected readonly disabled = signal<boolean>(false);

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  protected handleChange(event: Event): void {
    const v = (event.target as HTMLInputElement).checked;
    this.checked.set(v);
    this.onChange(v);
    this.onTouched();
  }

  writeValue(value: boolean | null): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
