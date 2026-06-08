/**
 * Reset Password Request.
 */
export interface ResetPasswordRequest {
  /**
   * Token.
   */
  readonly token: string;
  /**
   * Password.
   */
  readonly password: string;
}
