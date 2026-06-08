/**
 * Server-side shape of one row from `GET /api/events`. Mirrors
 * `Saturdaze.Application.Contracts.LocalEventDto`.
 */
export interface LocalEventDto {
  /**
   * Id.
   */
  readonly id: string;
  /**
   * Name.
   */
  readonly name: string;
  /**
   * Starts On.
   */
  readonly startsOn: string; // YYYY-MM-DD
  /**
   * Ends On.
   */
  readonly endsOn: string;
  /**
   * Location.
   */
  readonly location: string;
  /**
   * Drive Minutes.
   */
  readonly driveMinutes: number;
  /**
   * Url.
   */
  readonly url: string;
  /**
   * Category.
   */
  readonly category: string;
}
