import { MediaView } from '../media-view';

/** One `.review-item` card on the admin Review queue (A5). */
export interface ReviewItemView {
  /** The provider photo's id. */
  readonly id: string;
  readonly kind: 'Activity' | 'Restaurant' | 'LocalEvent';
  readonly placeId: string;
  readonly placeName: string;
  /** `/places/{kind}/{id}`. */
  readonly placeHref: string;
  /** "Restaurant · Provider terms". */
  readonly meta: string;
  /** The candidate, or null when its URL is blocked. */
  readonly candidate: MediaView | null;
  /** The primary it would replace, or null when the place has none. */
  readonly replaces: MediaView | null;
  /** "Would replace" / "Would become primary". */
  readonly replacesCaption: string;
  readonly tone: 'leaf' | 'sun' | 'sky';
  readonly icon: string;
}
