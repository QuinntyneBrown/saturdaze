import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { Chip, ChipTone } from '../chip/chip';
import { Icon } from '../icon/icon';

/**
 * Tag editor: existing values as removable chips plus a bare input that
 * adds on Enter or comma. Mirrors `.chip-input` inside a `.field`. CVA over
 * `string[]`; values are trimmed. A value already in the list (case-insensitive)
 * is refused with a message and stays in the field, never dropped silently (L2-140).
 */

let nextChipInputId = 0;

@Component({
  selector: 'sd-chip-input',
  standalone: true,
  imports: [Chip, Icon],
  templateUrl: './chip-input.html',
  styleUrl: './chip-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'field',
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
  readonly otherValues = input<readonly string[]>([]);
  readonly otherLabel = input<string>('');
  readonly tone = input<ChipTone>('leaf');
  readonly placeholder = input<string>('Add one, press Enter');

  protected readonly id = `sd-chip-input-${nextChipInputId++}`;
  protected readonly statusId = `${this.id}-status`;
  protected readonly values = signal<readonly string[]>([]);
  protected readonly draft = signal<string>('');
  protected readonly status = signal('');
  protected readonly statusTone = signal<'error' | 'success'>('success');
  protected readonly disabled = signal<boolean>(false);
  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  protected onDraft(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
    this.status.set('');
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
    const exists = this.values().find((x) => x.toLowerCase() === v.toLowerCase());
    if (exists) {
      this.statusTone.set('error');
      this.status.set(`${v} is already in ${this.label() || 'the list'}.`);
      return;
    }
    const conflict = this.otherValues().find((x) => x.toLowerCase() === v.toLowerCase());
    if (conflict) {
      this.statusTone.set('error');
      this.status.set(`${conflict} is in ${this.otherLabel()}. Remove it there first.`);
      return;
    }
    this.set([...this.values(), v]);
    this.draft.set('');
    this.statusTone.set('success');
    this.status.set(`${v} added to ${this.label()}.`);
  }

  protected removeAt(index: number): void {
    if (this.disabled()) return;
    const removed = this.values()[index];
    this.set(this.values().filter((_, i) => i !== index));
    this.statusTone.set('success');
    this.status.set(`${removed} removed.`);
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
