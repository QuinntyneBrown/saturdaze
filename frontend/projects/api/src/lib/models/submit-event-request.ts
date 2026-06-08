/**
 * Submit Event Request.
 */
export interface SubmitEventRequest {
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Starts At Local.
   */
  readonly startsAtLocal: string;
  /**
   * Ends At Local.
   */
  readonly endsAtLocal?: string | null;
  /**
   * Location.
   */
  readonly location?: string | null;
  /**
   * Description.
   */
  readonly description?: string | null;
  /**
   * Cost Note.
   */
  readonly costNote?: string | null;
  /**
   * Age Range.
   */
  readonly ageRange?: string | null;
  /**
   * Source Url.
   */
  readonly sourceUrl?: string | null;
  /**
   * Category.
   */
  readonly category?: string | null;
}
