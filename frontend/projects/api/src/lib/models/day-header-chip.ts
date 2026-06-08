/** A header chip describing the active day. */
export interface DayHeaderChip {
  /**
   * Tone.
   */
  readonly tone: 'sun' | 'sky' | 'leaf' | 'accent' | 'primary' | 'indoor' | 'warn' | 'default';
  /**
   * Icon.
   */
  readonly icon?: string;
  /**
   * Label.
   */
  readonly label: string;
}
