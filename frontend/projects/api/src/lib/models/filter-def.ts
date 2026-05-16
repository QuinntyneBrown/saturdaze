import { ActivityDto } from './activity.dto';
import { ActivityView } from './activity-view';

/**
 * Filter chips are derived from the data on each load. Predicate-based
 * filters that yield zero rows are hidden so the chip strip stays honest.
 * "All" is always present.
 */
export type FilterDef = {
  readonly label: string;
  readonly tone: ActivityView['filters'][number]['tone'];
  readonly match?: (a: ActivityDto) => boolean;
};
