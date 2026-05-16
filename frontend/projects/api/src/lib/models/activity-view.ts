import { ActivityFilter } from './activity-filter';
import { ActivitySection } from './activity-section';

export interface ActivityView {
  readonly filters: readonly ActivityFilter[];
  readonly sections: readonly ActivitySection[];
}
