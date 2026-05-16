import { Block } from './block';
import { DayHeaderChip } from './day-header-chip';
import { DayOption } from './day-option';
import { WeekendStat } from './weekend-stat';

/** Aggregate view powering the itinerary page. */
export interface ItineraryView {
  readonly day: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly icon: string;
  readonly chips: readonly DayHeaderChip[];
  readonly dayOptions: readonly DayOption[];
  readonly stats: readonly WeekendStat[];
  readonly previewTitle: string;
  readonly previewSubtitle: string;
  readonly blocks: readonly Block[];
}
