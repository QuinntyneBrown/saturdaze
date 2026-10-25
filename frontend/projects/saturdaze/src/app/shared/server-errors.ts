import { HttpErrorResponse } from '@angular/common/http';

/**
 * The first message a 400 gives for a field whose key matches `field`
 * (`Commitments[0].Location` matches /Location$/), or '' when there is none.
 */
export function fieldError(err: unknown, field: RegExp): string {
  if (!(err instanceof HttpErrorResponse) || err.status !== 400) return '';
  const errors = (err.error as { errors?: Record<string, string[]> } | null)?.errors ?? {};
  const key = Object.keys(errors).find((k) => field.test(k));
  return key ? (errors[key]?.[0] ?? '') : '';
}

/** A 400's first message, its ProblemDetails `detail`, or the fallback. */
export function saveError(
  err: unknown,
  fallback = 'That did not save. Try again in a moment.',
): string {
  if (!(err instanceof HttpErrorResponse) || err.status !== 400) return fallback;
  const body = err.error as { errors?: Record<string, string[]>; detail?: string } | null;
  const first = Object.values(body?.errors ?? {})[0]?.[0];
  return first ?? body?.detail ?? fallback;
}
