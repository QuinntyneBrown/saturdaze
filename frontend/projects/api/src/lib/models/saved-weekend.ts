/**
 * Saved Weekend.
 */
export interface SavedWeekend {
  /**
   * Id.
   */
  readonly id: string;
  /**
   * Date.
   */
  readonly date: string;
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Rating.
   */
  readonly rating: number;
  /**
   * Highlights.
   */
  readonly highlights: string;
  /**
   * Favourite.
   */
  readonly favourite?: boolean;
}
