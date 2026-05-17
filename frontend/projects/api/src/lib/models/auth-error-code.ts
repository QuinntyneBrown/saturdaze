/**
 * Uniform error codes returned by `/api/auth/*` endpoints. The frontend
 * branches on these to render the right inline message. Adding a new code
 * here is the contract change with the backend.
 */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_in_use'
  | 'weak_password'
  | 'token_expired'
  | 'token_invalid'
  | 'email_already_verified'
  | 'rate_limited';
