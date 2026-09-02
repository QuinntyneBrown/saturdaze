/**
 * Saved Weekend.
 */
export interface SavedWeekend {
  /**
   * Id.
   */
  readonly id: string;
  /**
   * Weekend Of — `YYYY-MM-DD`, for year filtering.
   */
  readonly weekendOf: string;
  /**
   * Date — "May 10–11, 2026".
   */
  readonly date: string;
  /**
   * Title — the user's name for the weekend, or a highlight-derived one.
   */
  readonly title: string;
  /**
   * Custom Title — the user-supplied name, `null` when derived.
   */
  readonly customTitle: string | null;
  /**
   * Rating — 0 when unrated.
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
