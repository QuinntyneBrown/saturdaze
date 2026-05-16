export type FamilyMemberTone = 'leaf' | 'sky' | 'sun' | 'primary' | 'indoor';

export interface FamilyMember {
  readonly name: string;
  readonly tone: FamilyMemberTone;
  readonly subtitle: string;
}

export interface Commitment {
  readonly title: string;
  readonly subtitle: string;
  readonly icon: string;
}

export interface RhythmEntry {
  readonly title: string;
  readonly subtitle: string;
  readonly icon: string;
  readonly chip: string;
}

export interface PreferenceToggle {
  readonly title: string;
  readonly subtitle: string;
  readonly checked: boolean;
}

export interface LikeChip {
  readonly label: string;
  readonly tone: 'leaf' | 'warn';
  readonly icon: string;
}

export interface FamilyProfile {
  readonly familyName: string;
  readonly location: string;
  readonly members: readonly FamilyMember[];
  readonly commitments: readonly Commitment[];
  readonly rhythm: readonly RhythmEntry[];
  readonly likes: readonly LikeChip[];
  readonly preferences: readonly PreferenceToggle[];
}
