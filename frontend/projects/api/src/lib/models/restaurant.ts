import type { FamilyVote } from './family-vote';

export type { FamilyVote } from './family-vote';
export type { RestaurantFilter } from './restaurant-filter';
export type { RestaurantSection } from './restaurant-section';
export type { RestaurantView } from './restaurant-view';
export type { Vote } from './vote';
export type { VoterTone } from './voter-tone';

export interface Restaurant {
  readonly name: string;
  readonly style: string;
  readonly near?: string;
  readonly drive?: string;
  readonly wifeapproved?: boolean;
  readonly icon?: string;
  readonly votes: readonly FamilyVote[];
}
