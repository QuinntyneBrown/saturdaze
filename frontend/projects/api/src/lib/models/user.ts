/**
 * Authenticated user — the subset of the backend `UserDto` the frontend
 * cares about. Email-verification state drives the soft-gate banner; role
 * gates the (future) admin surfaces.
 */
export interface User {
  /**
   * Id.
   */
  readonly id: string;
  /**
   * Email.
   */
  readonly email: string;
  /**
   * Role.
   */
  readonly role: 'User' | 'Admin';
  /**
   * Email Verified Utc.
   */
  readonly emailVerifiedUtc: string | null;
}
