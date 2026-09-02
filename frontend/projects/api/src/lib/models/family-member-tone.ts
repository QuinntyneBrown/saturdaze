export type FamilyMemberTone = 'leaf' | 'sky' | 'sun' | 'primary' | 'indoor';

/** Stable tone rotation for member avatars, oldest first. */
export const MEMBER_TONES: readonly FamilyMemberTone[] = [
  'primary',
  'leaf',
  'sky',
  'sun',
  'indoor',
];

/** The avatar tone for the member at `index` (oldest first). */
export function memberTone(index: number): FamilyMemberTone {
  return MEMBER_TONES[((index % MEMBER_TONES.length) + MEMBER_TONES.length) % MEMBER_TONES.length]!;
}
