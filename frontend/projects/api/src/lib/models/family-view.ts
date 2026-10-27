import { ChipView } from './chip-view';
import { CommitmentRow } from './commitment-row';
import { MemberRow } from './member-row';
import { PlannedAroundRow } from './planned-around-row';
import { PlanningRows } from './planning-settings';
import { PreferenceToggle } from './preference-toggle';

/**
 * Family View — the read-only projection of the family for the Family page
 * and the "Planned around" rows on the empty Weekend screen. Editing goes
 * through `EditableFamilyProfile`.
 */
export interface FamilyView {
  /**
   * Status.
   */
  readonly status: 'loading' | 'ready';
  /**
   * Headline — the family name, or "Your family".
   */
  readonly headline: string;
  /**
   * Subtitle — "Port Credit. Every weekend is planned around this."
   */
  readonly subtitle: string;
  /**
   * Home.
   */
  readonly home: {
    readonly location: string;
    readonly hint: 'Weather and drive times start here';
  };
  /**
   * Is Owner — the viewer changes who's in (L2-124).
   */
  readonly isOwner: boolean;
  /**
   * Owner Email — named to members who are not the owner.
   */
  readonly ownerEmail: string | null;
  /**
   * Owner Name — the owner's own row's name when they are in "Who's in" (L2-214).
   */
  readonly ownerName: string | null;
  /**
   * Self Member Id — the viewer's own row, if any (L2-214, L2-218).
   */
  readonly selfMemberId: string | null;
  /**
   * Needs Self — the viewer owns the family but is not in "Who's in" yet (L2-217).
   */
  readonly needsSelf: boolean;
  /**
   * Members — oldest first.
   */
  readonly members: readonly MemberRow[];
  /**
   * Commitments — in backend order.
   */
  readonly commitments: readonly CommitmentRow[];
  /**
   * Likes — leaf chips with a heart.
   */
  readonly likes: readonly ChipView[];
  /**
   * Dislikes — warn chips with a cross.
   */
  readonly dislikes: readonly ChipView[];
  /**
   * Preferences — the three toggles.
   */
  readonly preferences: readonly PreferenceToggle[];
  /**
   * Planned Around — who, commitments, likes.
   */
  readonly plannedAround: readonly PlannedAroundRow[];
  /**
   * Planning — the "How you plan" rows' values (L2-197).
   */
  readonly planning: PlanningRows;
}
