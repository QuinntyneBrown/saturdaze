import { ChipTone } from './chip-view';

/**
 * Filter Chip — a pressable filter in a `sd-filters` strip. `active` maps to
 * `aria-pressed`; the tone is the chip's resting colour, not its pressed
 * state.
 */
export interface FilterChip {
  /**
   * Label — also the identity a page sends back to `setFilter`.
   */
  readonly label: string;
  /**
   * Tone.
   */
  readonly tone: ChipTone;
  /**
   * Icon.
   */
  readonly icon?: string;
  /**
   * Active — true for the selected chip.
   */
  readonly active: boolean;
}
