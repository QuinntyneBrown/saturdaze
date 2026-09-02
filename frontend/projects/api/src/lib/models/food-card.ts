import { ChipView } from './chip-view';
import { FamilyVote } from './family-vote';

/**
 * Food Card — one restaurant on Ideas › Food. `topPick` and `lockedLabel`
 * are rendered by the card itself (head chip / locked chip); `chips` holds
 * only the descriptive row (Wife-approved, drive time).
 */
export interface FoodCard {
  /**
   * Id — the restaurant id.
   */
  readonly id: string;
  /**
   * Name.
   */
  readonly name: string;
  /**
   * Meta — "Mediterranean · Patio · 3 of 4 votes".
   */
  readonly meta: string;
  /**
   * Chips.
   */
  readonly chips: readonly ChipView[];
  /**
   * Votes — one per family member, oldest first.
   */
  readonly votes: readonly FamilyVote[];
  /**
   * Menu Url — the "See menu" link.
   */
  readonly menuUrl: string | null;
  /**
   * Top Pick — the first ranked, unlocked pick in its section.
   */
  readonly topPick: boolean;
  /**
   * Locked.
   */
  readonly locked: boolean;
  /**
   * Locked Label — "Locked for lunch"; `null` unless locked.
   */
  readonly lockedLabel: string | null;
  /**
   * Dimmed — a sibling of the locked pick.
   */
  readonly dimmed: boolean;
  /**
   * Votes Disabled — voting is closed once a pick is locked.
   */
  readonly votesDisabled: boolean;
}
