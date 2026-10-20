import { HttpErrorResponse } from '@angular/common/http';

/** The API's ProblemDetails `detail` or AuthError `message`, when the response carries one. */
export function serverMessage(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) return '';
  const body = err.error as { detail?: unknown; message?: unknown } | null;
  const text = body?.detail ?? body?.message;
  return typeof text === 'string' ? text : '';
}

/** The API's ProblemDetails `code`, when the response carries one. */
export function serverCode(err: unknown): string | null {
  if (!(err instanceof HttpErrorResponse)) return null;
  const body = err.error as { code?: unknown } | null;
  return typeof body?.code === 'string' ? body.code : null;
}
