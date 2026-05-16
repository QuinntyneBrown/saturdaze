import { Commitment } from './commitment';
import { FamilyMember } from './family-member';
import { LikeChip } from './like-chip';
import { PreferenceToggle } from './preference-toggle';
import { RhythmEntry } from './rhythm-entry';

export interface FamilyProfile {
  readonly familyName: string;
  readonly location: string;
  readonly members: readonly FamilyMember[];
  readonly commitments: readonly Commitment[];
  readonly rhythm: readonly RhythmEntry[];
  readonly likes: readonly LikeChip[];
  readonly preferences: readonly PreferenceToggle[];
}
