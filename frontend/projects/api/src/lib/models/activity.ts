import type { ActivityTone } from './activity-tone';

export type { ActivityFilter } from './activity-filter';
export type { ActivitySection } from './activity-section';
export type { ActivityTone } from './activity-tone';
export type { ActivityView } from './activity-view';

export interface Activity {
  readonly title: string;
  readonly subtitle?: string;
  readonly icon: string;
  readonly tone: ActivityTone;
  readonly drive?: string;
  readonly ages?: string;
  readonly tag?: string;
  readonly why?: string;
}
