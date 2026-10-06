/**
 * Idea Placement View — D27's preview well (L2-095 AC2, AC4).
 */
export interface IdeaPlacementView {
  readonly fits: boolean;
  /** "Saturday · 15:00 to 17:00", or "No room on Saturday". */
  readonly title: string;
  /** "Replaces Quiet time at home.", or why it does not fit. */
  readonly body: string;
}
