import { SharedWeekendDto } from './shared-weekend.dto';

/**
 * Join Preview — what an administrator's invite link is for, shown before the
 * invitee chooses a password (`POST /api/auth/join`, L2-161).
 */
export interface JoinPreview {
  /**
   * Email — the invited address the new account signs in with.
   */
  readonly email: string;
  /**
   * Invited By Email — the administrator who sent the invite.
   */
  readonly invitedByEmail: string | null;
  /**
   * Family Name — the sample family's name, `null` without a sample weekend.
   */
  readonly familyName: string | null;
  /**
   * Message — a line from the administrator, when any.
   */
  readonly message: string | null;
  /**
   * Sample — the weekend planned for the family as a share viewer sees it, or `null`.
   */
  readonly sample: SharedWeekendDto | null;
}

/**
 * Accept Join Request — `POST /api/auth/join/accept` (L2-161).
 */
export interface AcceptJoinRequest {
  /**
   * Token — from the join link's `?token=`.
   */
  readonly token: string;
  /**
   * Password — the invitee's own password.
   */
  readonly password: string;
}
