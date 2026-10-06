import { WeekendDay } from './weekend-day';

/**
 * Per-day totals (L2-090 AC5). Mirrors `Saturdaze.Application.Contracts.DayDto`.
 */
export interface DaySummaryDto {
  readonly day: WeekendDay;
  readonly stopCount: number;
  readonly drivingMinutes: number;
  readonly drivingKm: number;
}
