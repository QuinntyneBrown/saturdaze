/**
 * Local Event.
 */
export interface LocalEvent {
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Venue.
   */
  readonly venue: string;
  /**
   * When.
   */
  readonly when: string;
  /**
   * Drive.
   */
  readonly drive?: string;
  /**
   * Date Day.
   */
  readonly dateDay: string;
  /**
   * Date Mon.
   */
  readonly dateMon: string;
  /**
   * Tag.
   */
  readonly tag?: string;
}
