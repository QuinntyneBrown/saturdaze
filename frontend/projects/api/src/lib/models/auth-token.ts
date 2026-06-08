/**
 * Bearer token returned by the auth endpoints. Persisted under
 * `sd.auth.token` in localStorage (or sessionStorage when remember-me is
 * off — see `SessionStore`).
 */
export interface AuthToken {
  /**
   * Value.
   */
  readonly value: string;
  /**
   * Expires Utc.
   */
  readonly expiresUtc: string;
}
