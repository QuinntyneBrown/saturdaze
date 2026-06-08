/**
 * Event Filter.
 */
export interface EventFilter {
  /**
   * Label.
   */
  readonly label: string;
  /**
   * Tone.
   */
  readonly tone: 'default' | 'primary' | 'leaf' | 'indoor' | 'sun';
}
