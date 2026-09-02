/**
 * Body of `POST /api/auth/refresh`. The refresh token is the credential;
 * no bearer is required.
 */
export interface RefreshRequest {
  /**
   * Refresh Token.
   */
  readonly refreshToken: string;
}
