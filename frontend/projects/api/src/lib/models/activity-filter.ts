/**
 * Activity Filter.
 */
export interface ActivityFilter {
  /**
   * Label.
   */
  readonly label: string;
  /**
   * Tone.
   */
  readonly tone: 'default' | 'primary' | 'leaf' | 'indoor' | 'sky' | 'sun' | 'warn' | 'accent';
}
