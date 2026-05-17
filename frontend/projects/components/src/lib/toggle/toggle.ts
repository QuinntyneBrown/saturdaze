import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  booleanAttribute,
  effect,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Switch with optional label. Mirrors `docs/mocks/components/sd-toggle.js`.
 *
 * The `checked` attribute (host) reflects the current ON/OFF state. The
 * static `checked` input seeds the state; once a `FormControl` is bound,
 * `writeValue` becomes authoritative. Click and Space toggle the value.
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
    '[attr.role]': '"switch"',
    '[attr.aria-checked]': 'internalChecked()',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
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
  readonly checked = input(false, { transform: booleanAttribute });

  protected readonly internalChecked = signal<boolean>(false);
  protected readonly disabled = signal<boolean>(false);

  private formBound = false;
  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      // Static [checked] input seeds the state when used outside a form.
      // Once a FormControl binds, writeValue is authoritative — we stop
      // letting the static input clobber the form value.
      const c = this.checked();
      if (!this.formBound) {
        this.internalChecked.set(c);
      }
    });
  }

  @HostListener('click')
  protected onClick(): void {
    if (this.disabled()) return;
    this.toggle();
  }

  @HostListener('keydown.space', ['$event'])
  @HostListener('keydown.enter', ['$event'])
  protected onKey(event: Event): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.toggle();
  }

  private toggle(): void {
    const next = !this.internalChecked();
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
