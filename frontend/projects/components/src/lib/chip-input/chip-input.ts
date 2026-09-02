import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Chip, ChipTone } from '../chip/chip';

/**
 * Tag editor: existing values as removable chips plus a bare input that
 * adds on Enter or comma. Mirrors `.chip-input` inside a `.field`. CVA over
 * `string[]`; values are trimmed and de-duplicated case-insensitively.
 */

let nextChipInputId = 0;

@Component({
  selector: 'sd-chip-input',
  standalone: true,
  imports: [Chip],
  templateUrl: './chip-input.html',
  styleUrl: './chip-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'field',
    '[attr.label]': 'label() || null',
    '[attr.tone]': 'tone()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipInput),
      multi: true,
    },
  ],
})
export class ChipInput implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly tone = input<ChipTone>('leaf');
  readonly placeholder = input<string>('Add one, press Enter');

  protected readonly id = `sd-chip-input-${nextChipInputId++}`;
  protected readonly values = signal<readonly string[]>([]);
  protected readonly draft = signal<string>('');
  protected readonly disabled = signal<boolean>(false);

  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  protected onDraft(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.commit();
    } else if (event.key === 'Backspace' && !this.draft() && this.values().length) {
      this.removeAt(this.values().length - 1);
    }
  }

  protected commit(): void {
    const v = this.draft().trim();
    if (!v) return;
    const exists = this.values().some((x) => x.toLowerCase() === v.toLowerCase());
    if (!exists) this.set([...this.values(), v]);
    this.draft.set('');
  }

  protected removeAt(index: number): void {
    if (this.disabled()) return;
    this.set(this.values().filter((_, i) => i !== index));
  }

  private set(next: readonly string[]): void {
    this.values.set(next);
    this.onChange([...next]);
    this.onTouched();
  }

  writeValue(value: readonly string[] | null): void {
    this.values.set(value ? [...value] : []);
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
