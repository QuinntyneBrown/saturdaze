import { FamilyMemberTone } from './family-member-tone';

/** Derived from age: 18 and over is a parent. */
export type MemberRole = 'Parent' | 'Kid';

/**
 * Member Row — one person in the "Who's in" list.
 */
export interface MemberRow {
  /**
   * Id.
   */
  readonly id: string;
  /**
   * Name.
   */
  readonly name: string;
  /**
   * Initial — the avatar letter.
   */
  readonly initial: string;
  /**
   * Tone — the avatar tone, rotating oldest first.
   */
  readonly tone: FamilyMemberTone;
  /**
   * Age.
   */
  readonly age: number;
  /**
   * Role.
   */
  readonly role: MemberRole;
  /**
   * Subtitle — "Parent · 38" / "Kid · 9".
   */
  readonly subtitle: string;
}
