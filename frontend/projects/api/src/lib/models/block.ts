import { DayChip } from './day-chip';

/**
 * One block in a day's timeline. The full feature set is used from Phase 2
 * onward; Phase 1 only needs the preview-friendly subset, so optional
 * fields stay optional.
 */
export interface Block {
  readonly time: string;
  readonly duration?: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly icon: string;
  readonly tone?:
    | 'default'
    | 'meal'
    | 'drive'
    | 'workout'
    | 'fixed'
    | 'downtime'
    | 'indoor';
  readonly locked?: boolean;
  readonly drive?: string;
  readonly chips?: readonly DayChip[];
}
