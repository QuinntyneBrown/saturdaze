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
 * Native `<select>` in the `.field` clothes (`select.field__input` in the
 * mocks, with the chevron drawn as a background image). CVA over the
 * option's string value.
 */

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

let nextSelectId = 0;

@Component({
  selector: 'sd-select',
  standalone: true,
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'field',
    '[attr.label]': 'label() || null',
    '[attr.required]': 'required() ? "" : null',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Select),
      multi: true,
    },
  ],
})
export class Select implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly options = input<readonly SelectOption[]>([]);
  readonly hint = input<string>('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly name = input<string>('');

  protected readonly id = `sd-select-${nextSelectId++}`;
  protected readonly value = signal<string>('');
  protected readonly disabled = signal<boolean>(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected handleChange(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.value.set(v);
    this.onChange(v);
    this.onTouched();
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
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
