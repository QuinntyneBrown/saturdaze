import { HttpErrorResponse } from '@angular/common/http';

/** The upload limit the API enforces (L2-115 AC3). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const TOO_LARGE = 'That photo is over 10 MB. Choose a smaller one.';
export const NOT_A_PHOTO = 'That file is not a photo we can use. Choose a JPEG, PNG or WebP.';
export const FAILED = 'The photo did not save. Try again in a moment.';

/** The message for a server refusal of a photo (413, `unsupported_image`, a field error). */
export function uploadErrorMessage(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) return FAILED;
  if (err.status === 413) return TOO_LARGE;
  if (err.status === 400) {
    const body: unknown = err.error;
    if (body && typeof body === 'object') {
      if ('code' in body && body.code === 'unsupported_image') return NOT_A_PHOTO;
      if ('errors' in body && body.errors && typeof body.errors === 'object') {
        const first = Object.values(body.errors as Record<string, string[]>)[0];
        if (first?.[0]) return first[0];
      }
    }
  }
  return FAILED;
}
