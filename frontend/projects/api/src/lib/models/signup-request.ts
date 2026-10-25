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
  /**
   * Owner Name — the owner's first name; with `ownerAge` it puts them in "Who's in" (L2-215).
   */
  readonly ownerName?: string;
  /**
   * Owner Age — 0 to 120.
   */
  readonly ownerAge?: number;
}
