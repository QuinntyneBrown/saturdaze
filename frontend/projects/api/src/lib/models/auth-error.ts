import { AuthErrorCode } from './auth-error-code';

/**
 * Surfaced by `SessionStore.error` and consumed by every auth page to
 * render an inline message above the submit button.
 */
export interface AuthError {
  readonly code: AuthErrorCode;
  readonly message: string;
}
