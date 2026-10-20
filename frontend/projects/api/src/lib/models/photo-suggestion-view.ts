import { MediaView } from './media-view';

/**
 * Photo Suggestion View — one photo Claude found on the web, fetched and
 * cleaned by the API (L2-157). The media's `src` is the API's signed preview
 * and its `credit` the attribution that goes with the photo.
 */
export interface PhotoSuggestionView {
  readonly id: string;
  readonly media: MediaView;
  readonly title: string;
  readonly sourceName: string;
  readonly sourceUrl: string;
  readonly attribution: string;
  readonly licence: string;
}

/** What a search is for; the API decides the research context from it (L2-157). */
export type PhotoSuggestionRequest =
  | { readonly target: 'weekendCover'; readonly weekendId: string; readonly query?: string }
  | {
      readonly target: 'place';
      readonly kind: string;
      readonly placeId: string;
      readonly query?: string;
    }
  | { readonly target: 'profile'; readonly query: string };
