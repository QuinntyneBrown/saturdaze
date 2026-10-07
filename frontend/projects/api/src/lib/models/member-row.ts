import { FamilyMemberTone } from './family-member-tone';

/** Derived from age: 18 and over is a parent. */
export type MemberRole = 'Parent' | 'Kid';

/** Whether a member signs in: never, invited, or with their own account (L2-124). */
export type MemberAccess = 'None' | 'Invited' | 'Account';

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
   * Access — how the member signs in.
   */
  readonly access: MemberAccess;
  /**
   * Email — the invited or signed-in address; `null` for `None`.
   */
  readonly email: string | null;
  /**
   * Subtitle — "Parent · 38" / "Kid · 9" / "Parent · 36 · Invite sent to sara@example.com".
   */
  readonly subtitle: string;
}
