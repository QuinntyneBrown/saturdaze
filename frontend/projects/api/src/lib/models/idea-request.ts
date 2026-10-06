import { WeekendDay } from './weekend-day';

export type IdeaKind = 'activity' | 'event';
export type IdeaTiming = 'bestFit' | 'morning' | 'afternoon';

/**
 * Idea Request — which idea, which day and roughly when (L2-107).
 */
export interface IdeaRequest {
  readonly ideaKind: IdeaKind;
  readonly ideaId: string;
  readonly day: WeekendDay;
  readonly timing: IdeaTiming;
}
