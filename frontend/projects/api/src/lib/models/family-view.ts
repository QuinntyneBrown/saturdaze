import { ChipView } from './chip-view';
import { CommitmentRow } from './commitment-row';
import { MemberRow } from './member-row';
import { PlannedAroundRow } from './planned-around-row';
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
}
