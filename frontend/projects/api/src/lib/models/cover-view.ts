import { MediaView } from './media-view';

/**
 * Cover View — the photo that leads the Weekend screen (L2-108). The media's
 * credit is the cover label ("From La Marina").
 */
export interface CoverView {
  readonly media: MediaView;
  readonly source: 'default' | 'stop' | 'upload';
  readonly placeId: string | null;
}

/** One stop photo the family can pick as the cover (D29). */
export interface CoverChoice {
  readonly placeId: string;
  readonly name: string;
  readonly media: MediaView;
}

/** What D29 sends back: the default rule, a stop's photo, or a web suggestion (L2-158). */
export type CoverSelection =
  | { readonly source: 'default' }
  | { readonly source: 'stop'; readonly placeId: string }
  | { readonly source: 'suggestion'; readonly suggestionId: string };
