/**
 * Authenticated user — the subset of the backend `UserDto` the frontend
 * cares about. Email-verification state drives the soft-gate banner; role
 * gates the (future) admin surfaces.
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly role: 'User' | 'Admin';
  readonly emailVerifiedUtc: string | null;
}
