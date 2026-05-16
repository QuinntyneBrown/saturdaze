import { DayChip } from './day-chip';

export interface DaySummary {
  readonly day: string;
  readonly date: string;
  readonly weather: string;
  readonly icon: string;
  readonly highlight: string;
  readonly chips: readonly DayChip[];
}
