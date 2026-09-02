/**
 * Past Weekend Card — one `sd-past-card` on the Past page.
 */
export interface PastWeekendCard {
  /**
   * Id — the weekend id.
   */
  readonly id: string;
  /**
   * Weekend Of — the Saturday, `YYYY-MM-DD`.
   */
  readonly weekendOf: string;
  /**
   * Eyebrow — "10 – 11 May 2026".
   */
  readonly eyebrow: string;
  /**
   * Title — the custom name, or a name built from the highlights.
   */
  readonly title: string;
  /**
   * Custom Title — what the family typed, `null` when unnamed.
   */
  readonly customTitle: string | null;
  /**
   * Rating — 0 when unrated, else 1..5.
   */
  readonly rating: number;
  /**
   * Rating Label — "5 of 5" / "Rate it".
   */
  readonly ratingLabel: string;
  /**
   * Highlights — "Bronte Creek · Rec Room".
   */
  readonly highlights: string;
  /**
   * Favourite.
   */
  readonly favourite: boolean;
}
