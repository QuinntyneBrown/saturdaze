import { HttpErrorResponse } from '@angular/common/http';

import { errorCode } from './upload-errors';

export const TEMPLATE_KEY_EXISTS = 'A template already uses this key. Choose another.';
export const TEMPLATE_STALE = 'Someone else changed this template.';
export const TEMPLATE_FAILED = 'That did not go through. Try again in a moment.';

/** What each API refusal of a template change means to the administrator (L2-132 → L2-135). */
const MESSAGES: Record<string, string> = {
  template_key_exists: TEMPLATE_KEY_EXISTS,
  template_stale: TEMPLATE_STALE,
  unsafe_html:
    "Scripts, frames, forms, on… event attributes and the raw filter aren't allowed in an email. Remove them and save again.",
  system_template: 'A system template stays active and cannot be deleted.',
};

/** Refusals whose server message is the explanation: it names the field, variable or position. */
const DETAILED = ['missing_placeholder', 'invalid_template'];

/** The server's reason for a refused template change, in words; a field error's own message when there is one. */
export function templateErrorMessage(err: unknown): string {
  const code = errorCode(err);
  if (code && DETAILED.includes(code) && err instanceof HttpErrorResponse) {
    const detail = (err.error as { detail?: unknown } | null)?.detail;
    if (typeof detail === 'string' && detail) return detail;
  }
  if (code && MESSAGES[code]) return MESSAGES[code];
  if (err instanceof HttpErrorResponse && err.status === 400) {
    const body: unknown = err.error;
    if (body && typeof body === 'object' && 'errors' in body && body.errors) {
      const first = Object.values(body.errors as Record<string, string[]>)[0];
      if (first?.[0]) return first[0];
    }
  }
  return TEMPLATE_FAILED;
}

export { errorCode };
