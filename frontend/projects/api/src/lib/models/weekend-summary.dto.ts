/**
 * Server-side shape of one row from `GET /api/weekends/history`. Mirrors
 * `Saturdaze.Application.Contracts.WeekendSummaryDto`.
 */
export interface WeekendSummaryDto {
  readonly id: string;
  readonly weekendOf: string; // YYYY-MM-DD
  readonly isFavourite: boolean;
  readonly regenerateCount: number;
  readonly blockCount: number;
  readonly activityHighlights: ReadonlyArray<string>;
  readonly title: string | null;
  readonly rating: number | null;
}
