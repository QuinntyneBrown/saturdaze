/**
 * Signup Request.
 */
export interface SignupRequest {
  /**
   * Family Name.
   */
  readonly familyName: string;
  /**
   * Home Location.
   */
  readonly homeLocation: string;
  /**
   * Email.
   */
  readonly email: string;
  /**
   * Password.
   */
  readonly password: string;
  /**
   * Friday Preview.
   */
  readonly fridayPreview?: boolean;
}
