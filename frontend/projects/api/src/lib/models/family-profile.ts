import { LikeChip } from './like-chip';
import { PreferenceToggle } from './preference-toggle';

/**
 * Family Profile — the read-only presentation of the family. Members and
 * commitments are edited through `EditableFamilyProfile`, so they are not
 * duplicated here.
 */
export interface FamilyProfile {
  /**
   * Family Name — `null` until the family has been named.
   */
  readonly familyName: string | null;
  /**
   * Location.
   */
  readonly location: string;
  /**
   * Likes.
   */
  readonly likes: readonly LikeChip[];
  /**
   * Preferences.
   */
  readonly preferences: readonly PreferenceToggle[];
}
