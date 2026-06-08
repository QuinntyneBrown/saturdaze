/**
 * Saved Filter.
 */
export interface SavedFilter {
  /**
   * Label.
   */
  readonly label: string;
  /**
   * Icon.
   */
  readonly icon?: string;
  /**
   * Tone.
   */
  readonly tone: 'default' | 'primary' | 'accent';
}
