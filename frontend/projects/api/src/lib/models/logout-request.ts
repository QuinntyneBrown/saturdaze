/**
 * Body of `POST /api/auth/logout`. Revokes the refresh token server-side;
 * idempotent, so a stale or already-revoked token still yields 204.
 */
export interface LogoutRequest {
  /**
   * Refresh Token.
   */
  readonly refreshToken: string;
}
