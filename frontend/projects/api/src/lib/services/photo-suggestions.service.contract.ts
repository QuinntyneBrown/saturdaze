import { InjectionToken } from '@angular/core';

import { PhotoSuggestionRequest, PhotoSuggestionView } from '../models/photo-suggestion-view';

/**
 * Contract for AI photo suggestions (L2-157). The dialogs inject
 * `PHOTO_SUGGESTIONS_SERVICE` and depend only on this interface; the API
 * asks Claude, fetches and cleans each candidate and serves the previews.
 */
export interface IPhotoSuggestionsService {
  /**
   * Find — `POST /api/photo-suggestions`. Resolves with the suggestions the
   * API verified (possibly none). Rejects with the server's
   * `HttpErrorResponse` (503 `suggestions_unavailable`, 429 `suggestion_limit`).
   *
   * @param {PhotoSuggestionRequest} request - What the photo is for
   *
   * @returns {Promise<readonly PhotoSuggestionView[]>} The suggestions, previews anchored to the API
   */
  find(request: PhotoSuggestionRequest): Promise<readonly PhotoSuggestionView[]>;
}

export const PHOTO_SUGGESTIONS_SERVICE = new InjectionToken<IPhotoSuggestionsService>(
  'PHOTO_SUGGESTIONS_SERVICE',
);
