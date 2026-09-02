import { ActivityDto } from './activity.dto';
import { ChipTone } from './chip-view';

/**
 * Filter Def — an activity filter chip and its predicate. "All" has no
 * predicate. Internal to `ActivityService`.
 */
export type FilterDef = {
  readonly label: string;
  readonly tone: ChipTone;
  readonly match?: (a: ActivityDto) => boolean;
};
