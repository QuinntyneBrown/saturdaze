/**
 * Server-side shape of one row from `GET /api/events`. Mirrors
 * `Saturdaze.Application.Contracts.LocalEventDto`.
 */
export interface LocalEventDto {
  readonly id: string;
  readonly name: string;
  readonly startsOn: string; // YYYY-MM-DD
  readonly endsOn: string;
  readonly location: string;
  readonly driveMinutes: number;
  readonly url: string;
  readonly category: string;
}
