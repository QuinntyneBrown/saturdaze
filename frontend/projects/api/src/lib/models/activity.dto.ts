/**
 * Server-side shape of one row from `GET /api/activities`. Mirrors
 * `Saturdaze.Application.Contracts.ActivityDto`.
 */
export interface ActivityDto {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly indoor: boolean;
  readonly minAge: number;
  readonly maxAge: number;
  readonly driveMinutes: number;
  readonly weatherTags: ReadonlyArray<string>;
  readonly typicalDurationMinutes: number;
  readonly description: string;
  readonly mapUrl: string;
}
