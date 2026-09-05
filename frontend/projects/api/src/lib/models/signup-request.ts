/**
 * Signup Request.
 */
export interface SignupRequest {
  /**
   * Family Name.
   */
  readonly familyName: string;
  /**
   * Home Location — optional at sign-up; set later on the Family page.
   */
  readonly homeLocation?: string | null;
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
