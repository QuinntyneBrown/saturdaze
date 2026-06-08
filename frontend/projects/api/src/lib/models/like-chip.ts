/**
 * Like Chip.
 */
export interface LikeChip {
  /**
   * Label.
   */
  readonly label: string;
  /**
   * Tone.
   */
  readonly tone: 'leaf' | 'warn';
  /**
   * Icon.
   */
  readonly icon: string;
}
