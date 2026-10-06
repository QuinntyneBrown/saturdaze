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

/** One stop photo the family can pick as the cover (D28). */
export interface CoverChoice {
  readonly placeId: string;
  readonly name: string;
  readonly media: MediaView;
}

/** What D28 sends back: the default rule, or a stop's photo. */
export type CoverSelection =
  | { readonly source: 'default' }
  | { readonly source: 'stop'; readonly placeId: string };
