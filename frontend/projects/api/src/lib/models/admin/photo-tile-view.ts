import { ChipView } from '../chip-view';
import { MediaView } from '../media-view';

/** One `sd-photo-tile` on the admin Place photos screen (A4). */
export interface PhotoTileView {
  readonly id: string;
  readonly url: string;
  /** Null when the photo is blocked. */
  readonly media: MediaView | null;
  readonly blocked: boolean;
  readonly isPrimary: boolean;
  readonly source: 'Curated' | 'Provider' | 'Submitter';
  readonly unreviewed: boolean;
  readonly badges: readonly ChipView[];
  readonly alt: string;
  readonly credit: string;
  readonly licence: string;
  /** "1200 × 675". */
  readonly size: string;
}
