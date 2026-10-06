import { MediaView } from '../media-view';

/** One row of the admin Places list (A3). */
export interface PlaceRow {
  readonly kind: 'Activity' | 'Restaurant' | 'LocalEvent';
  readonly id: string;
  readonly name: string;
  /** "Activity · 3 photos". */
  readonly meta: string;
  readonly photo: MediaView | null;
  /** Fallback tile tone and icon when there is no photo. */
  readonly tone: 'leaf' | 'sun' | 'sky';
  readonly icon: string;
  /** The Place photos screen for this row. */
  readonly href: string;
}
