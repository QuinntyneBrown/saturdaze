import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Icon } from '../icon/icon';

/**
 * Labelled text field. Mirrors `.field` in docs/mocks-v2/styles/app.css:
 * label (with an optional "Required" marker), the input or a textarea
 * (`multiline`), a hint, and an error line that also sets `aria-invalid`.
 *
 * Reactive Forms / ngModel: implements `ControlValueAccessor`. The static
 * `value` input seeds the state; a later `writeValue` overrides it.
 */

let nextFieldId = 0;

@Component({
  selector: 'sd-text-input',
  standalone: true,
  imports: [Icon],
  templateUrl: './text-input.html',
  styleUrl: './text-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'field',
    '[attr.label]': 'label() || null',
    '[attr.type]': 'type()',
    '[attr.hint]': 'hint() || null',
    '[attr.error]': 'error() || null',
    '[attr.required]': 'required() ? "" : null',
    '[attr.invalid]': 'invalid() ? "" : null',
    '[attr.multiline]': 'multiline() ? "" : null',
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
  /** Inline error; non-empty also sets `aria-invalid`. */
  readonly error = input<string>('');
  readonly required = input(false, { transform: booleanAttribute });
  /** Mark invalid without an inline message (a form-level error banner). */
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly multiline = input(false, { transform: booleanAttribute });
  readonly rows = input<number>(3);
  readonly readonly = input(false, { transform: booleanAttribute });
  // Forwarded to the inner control so password managers and autofill
  // recognise sign-in / sign-up fields.
  readonly autocomplete = input<string>('');
  readonly name = input<string>('');
  readonly min = input<string | number | null>(null);
  readonly max = input<string | number | null>(null);
  readonly step = input<string | number | null>(null);

  protected readonly id = `sd-field-${nextFieldId++}`;
  protected readonly hintId = `${this.id}-hint`;
  protected readonly errorId = `${this.id}-error`;
  protected readonly internalValue = signal<string>('');
  protected readonly disabled = signal<boolean>(false);

  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.error()) ids.push(this.errorId);
    if (this.hint()) ids.push(this.hintId);
    return ids.length ? ids.join(' ') : null;
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      const v = this.value();
      if (v) this.internalValue.set(v);
    });
  }

  protected handleInput(event: Event): void {
    const v = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
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
