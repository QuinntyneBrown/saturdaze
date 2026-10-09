/**
 * Invitation — what an invite link is for, shown before the invitee chooses
 * a password (`POST /api/auth/invitation`, L2-127).
 */
export interface Invitation {
  /**
   * Family Name — `null` when the family has not been named.
   */
  readonly familyName: string | null;
  /**
   * Email — the invited address the new account signs in with.
   */
  readonly email: string;
  /**
   * Invited By Email — the owner who sent the invite.
   */
  readonly invitedByEmail: string | null;
}

/**
 * Accept Invitation Request — `POST /api/auth/accept-invitation` (L2-127).
 */
export interface AcceptInvitationRequest {
  /**
   * Token — from the invite link's `?token=`.
   */
  readonly token: string;
  /**
   * Password — the invitee's own password.
   */
  readonly password: string;
}
