/**
 * Token pair returned by the auth endpoints. Persisted under
 * `sd.auth.token` in localStorage (or sessionStorage when remember-me is
 * off — see `SessionStore`).
 */
export interface AuthToken {
  /**
   * Access token (JWT) sent as the bearer on API requests.
   */
  readonly value: string;
  /**
   * Access-token expiry, ISO-8601 UTC.
   */
  readonly expiresUtc: string;
  /**
   * Opaque rotating refresh token exchanged at `/api/auth/refresh`. Empty
   * string for tokens persisted before refresh support shipped.
   */
  readonly refreshToken: string;
}

/**
 * True when the access token expires within `withinMs` (default 60 s), so
 * the caller can refresh proactively instead of eating a 401. An
 * unparseable expiry is treated as "not expiring" so a malformed value
 * degrades to the reactive 401 path rather than a refresh loop.
 */
export function isTokenExpiring(token: AuthToken, withinMs = 60_000): boolean {
  const ms = Date.parse(token.expiresUtc);
  if (Number.isNaN(ms)) return false;
  return ms - Date.now() <= withinMs;
}
