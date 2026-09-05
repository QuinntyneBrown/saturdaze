import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Segmented radio group (Saturday | Sunday | Either). Mirrors `.seg-radio`
 * inside a `.field`; two or three options. CVA over the option's value.
 */

export interface SegRadioOption {
  readonly value: string;
  readonly label: string;
}

let nextSegRadioId = 0;

@Component({
  selector: 'sd-seg-radio',
  standalone: true,
  templateUrl: './seg-radio.html',
  styleUrl: './seg-radio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'field',
    '[attr.label]': 'label() || null',
    '[attr.value]': 'value() || null',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SegRadio),
      multi: true,
    },
  ],
})
export class SegRadio implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly options = input<readonly SegRadioOption[]>([]);

  protected readonly id = `sd-seg-radio-${nextSegRadioId++}`;
  protected readonly labelId = `${this.id}-label`;
  protected readonly value = signal<string>('');
  protected readonly disabled = signal<boolean>(false);
  protected readonly three = computed(() => this.options().length >= 3);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected pick(v: string): void {
    if (this.disabled()) return;
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
