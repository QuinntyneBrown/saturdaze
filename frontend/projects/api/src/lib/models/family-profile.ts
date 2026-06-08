import { Commitment } from './commitment';
import { FamilyMember } from './family-member';
import { LikeChip } from './like-chip';
import { PreferenceToggle } from './preference-toggle';
import { RhythmEntry } from './rhythm-entry';

/**
 * Family Profile.
 */
export interface FamilyProfile {
  /**
   * Family Name.
   */
  readonly familyName: string;
  /**
   * Location.
   */
  readonly location: string;
  /**
   * Members.
   */
  readonly members: readonly FamilyMember[];
  /**
   * Commitments.
   */
  readonly commitments: readonly Commitment[];
  /**
   * Rhythm.
   */
  readonly rhythm: readonly RhythmEntry[];
  /**
   * Likes.
   */
  readonly likes: readonly LikeChip[];
  /**
   * Preferences.
   */
  readonly preferences: readonly PreferenceToggle[];
}
