import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';

/**
 * Toggle chip for filter rows. Mirrors `.filter-chip` — a real `<button>`
 * with `aria-pressed`; the host adds no box. Off = outline, on = filled
 * (ink by default, or the chip's hue when a tone is given).
 */

export type FilterChipTone = 'default' | 'leaf' | 'indoor' | 'sky' | 'sun' | 'accent' | 'primary';

@Component({
  selector: 'sd-filter-chip',
  standalone: true,
  templateUrl: './filter-chip.html',
  styleUrl: './filter-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.pressed]': 'pressed() ? "" : null',
    '[attr.tone]': 'tone() === "default" ? null : tone()',
    '[attr.disabled]': 'disabled() ? "" : null',
  },
})
export class FilterChip {
  readonly pressed = input(false, { transform: booleanAttribute });
  readonly tone = input<FilterChipTone>('default');
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Emits the next pressed state on click; the page owns the truth. */
  readonly pressedChange = output<boolean>();

  protected readonly classes = computed(() => ({
    'filter-chip': true,
    [`filter-chip--${this.tone()}`]: this.tone() !== 'default',
  }));

  protected toggle(): void {
    if (this.disabled()) return;
    this.pressedChange.emit(!this.pressed());
  }
}
