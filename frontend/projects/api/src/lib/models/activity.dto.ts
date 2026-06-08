/**
 * Server-side shape of one row from `GET /api/activities`. Mirrors
 * `Saturdaze.Application.Contracts.ActivityDto`.
 */
export interface ActivityDto {
  /**
   * Id.
   */
  readonly id: string;
  /**
   * Name.
   */
  readonly name: string;
  /**
   * Category.
   */
  readonly category: string;
  /**
   * Indoor.
   */
  readonly indoor: boolean;
  /**
   * Min Age.
   */
  readonly minAge: number;
  /**
   * Max Age.
   */
  readonly maxAge: number;
  /**
   * Drive Minutes.
   */
  readonly driveMinutes: number;
  /**
   * Weather Tags.
   */
  readonly weatherTags: ReadonlyArray<string>;
  /**
   * Typical Duration Minutes.
   */
  readonly typicalDurationMinutes: number;
  /**
   * Description.
   */
  readonly description: string;
  /**
   * Map Url.
   */
  readonly mapUrl: string;
}
