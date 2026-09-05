/** The tones a chip can take. Mirrors the `chip--*` modifiers in the mocks. */
export type ChipTone =
  | 'default'
  | 'sun'
  | 'sky'
  | 'leaf'
  | 'indoor'
  | 'warn'
  | 'accent'
  | 'primary'
  | 'neutral';

/**
 * Chip View — one presentational chip: a tone, an optional leading icon and
 * its label. Shared by every view model that renders a chip row.
 */
export interface ChipView {
  /**
   * Tone.
   */
  readonly tone: ChipTone;
  /**
   * Icon — an `sd-icon` name, when the chip leads with a glyph.
   */
  readonly icon?: string;
  /**
   * Label.
   */
  readonly label: string;
}
