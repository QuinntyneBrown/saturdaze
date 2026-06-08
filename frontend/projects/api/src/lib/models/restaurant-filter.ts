/**
 * Restaurant Filter.
 */
export interface RestaurantFilter {
  /**
   * Label.
   */
  readonly label: string;
  /**
   * Tone.
   */
  readonly tone: 'default' | 'primary' | 'accent' | 'sky' | 'leaf';
}
