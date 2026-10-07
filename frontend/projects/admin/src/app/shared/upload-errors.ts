import { HttpErrorResponse } from '@angular/common/http';

/** The upload limit the API enforces (L2-115 AC3). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const TOO_LARGE = 'That photo is over 10 MB. Choose a smaller one.';
export const NOT_A_PHOTO = 'That file is not a photo we can use. Choose a JPEG, PNG or WebP.';
export const FAILED = 'The photo did not save. Try again in a moment.';
export const URL_NOT_ALLOWED = "This address isn't on the image allow-list.";
export const URL_NOT_IMAGE = 'That address did not return a JPEG, PNG or WebP image.';
export const PHOTO_EXISTS = 'This place already has that photo.';

/** The API's ProblemDetails `code`, when the failure carries one. */
export function errorCode(err: unknown): string | null {
  if (!(err instanceof HttpErrorResponse)) return null;
  const body: unknown = err.error;
  return body && typeof body === 'object' && 'code' in body && typeof body.code === 'string'
    ? body.code
    : null;
}

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
