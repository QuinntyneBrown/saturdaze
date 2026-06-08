import type { FamilyVote } from './family-vote';

export type { FamilyVote } from './family-vote';
export type { RestaurantFilter } from './restaurant-filter';
export type { RestaurantSection } from './restaurant-section';
export type { RestaurantView } from './restaurant-view';
export type { Vote } from './vote';
export type { VoterTone } from './voter-tone';

/**
 * Restaurant.
 */
export interface Restaurant {
  /**
   * Id.
   */
  readonly id?: string;
  /**
   * Name.
   */
  readonly name: string;
  /**
   * Style.
   */
  readonly style: string;
  /**
   * Near.
   */
  readonly near?: string;
  /**
   * Drive.
   */
  readonly drive?: string;
  /**
   * Wifeapproved.
   */
  readonly wifeapproved?: boolean;
  /**
   * Icon.
   */
  readonly icon?: string;
  /**
   * Menu Url.
   */
  readonly menuUrl?: string | null;
  /**
   * Locked.
   */
  readonly locked?: boolean;
  /**
   * Votes.
   */
  readonly votes: readonly FamilyVote[];
}
