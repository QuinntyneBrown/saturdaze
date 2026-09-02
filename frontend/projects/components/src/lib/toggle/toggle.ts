import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  effect,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Switch. Mirrors `.toggle` in docs/mocks-v2/styles/app.css: a real
 * `<input type="checkbox" role="switch">` (visually hidden) inside a label,
 * so keyboard, focus and assistive tech come for free. `label` renders the
 * visible text; `srLabel` gives a name when there is none.
 *
 * The static `checked` input seeds the state; once a `FormControl` binds,
 * `writeValue` is authoritative. `changed` emits on every user toggle.
 */
@Component({
  selector: 'sd-toggle',
  standalone: true,
  templateUrl: './toggle.html',
  styleUrl: './toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.label]': 'label() || null',
    '[attr.checked]': 'internalChecked() ? "" : null',
    '[attr.disabled]': 'disabled() ? "" : null',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Toggle),
      multi: true,
    },
  ],
})
export class Toggle implements ControlValueAccessor {
  readonly label = input<string>('');
  /** Accessible name when no visible label is rendered. */
  readonly srLabel = input<string>('');
  readonly checked = input(false, { transform: booleanAttribute });

  protected readonly internalChecked = signal<boolean>(false);
  protected readonly disabled = signal<boolean>(false);

  private formBound = false;
  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      const c = this.checked();
      if (!this.formBound) this.internalChecked.set(c);
    });
  }

  protected handleChange(event: Event): void {
    const next = (event.target as HTMLInputElement).checked;
    this.internalChecked.set(next);
    this.onChange(next);
    this.onTouched();
  }

  writeValue(value: boolean | null): void {
    this.formBound = true;
    this.internalChecked.set(!!value);
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
