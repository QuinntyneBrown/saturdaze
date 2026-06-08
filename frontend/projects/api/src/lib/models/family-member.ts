import { FamilyMemberTone } from './family-member-tone';

/**
 * Family Member.
 */
export interface FamilyMember {
  /**
   * Name.
   */
  readonly name: string;
  /**
   * Tone.
   */
  readonly tone: FamilyMemberTone;
  /**
   * Subtitle.
   */
  readonly subtitle: string;
}
