import { WeekendDay } from './weekend-day';

/**
 * Where the planner would put an idea (L2-095). Mirrors
 * `Saturdaze.Application.Contracts.IdeaPlacementDto`.
 */
export interface IdeaPlacementDto {
  readonly day: WeekendDay;
  readonly startTime: string; // HH:mm:ss
  readonly endTime: string;
  readonly replacedBlockTitles: readonly string[];
  readonly fits: boolean;
  readonly reason: string | null;
}
