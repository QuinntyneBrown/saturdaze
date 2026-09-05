/**
 * Planned Around Row — one of the three "Planned around" rows on the empty
 * Weekend screen; each links to the Family page.
 */
export interface PlannedAroundRow {
  /**
   * Icon.
   */
  readonly icon: string;
  /**
   * Title — "The Browns, Port Credit".
   */
  readonly title: string;
  /**
   * Subtitle — "2 parents · Eli 9 · Mae 5".
   */
  readonly subtitle: string;
  /**
   * Href.
   */
  readonly href: '/family';
}
