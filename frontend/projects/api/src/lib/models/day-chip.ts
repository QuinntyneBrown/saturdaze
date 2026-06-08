/**
 * Day Chip.
 */
export interface DayChip {
  /**
   * Tone.
   */
  readonly tone: 'default' | 'sun' | 'sky' | 'leaf' | 'indoor' | 'warn' | 'accent' | 'primary';
  /**
   * Icon.
   */
  readonly icon?: string;
  /**
   * Label.
   */
  readonly label: string;
}
