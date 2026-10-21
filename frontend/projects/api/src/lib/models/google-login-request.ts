/**
 * Google Login Request — `POST /api/auth/google` (L2-163).
 */
export interface GoogleLoginRequest {
  /**
   * The Google ID token Google Identity Services handed the browser.
   */
  readonly credential: string;
}
