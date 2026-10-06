import { MediaView } from '../media-view';
import { PhotoTileView } from './photo-tile-view';

/** The admin Place photos screen (A4). */
export interface PlacePhotosView {
  readonly kind: 'Activity' | 'Restaurant' | 'LocalEvent';
  readonly id: string;
  readonly name: string;
  /** "Activity · 4 photos · 5 weekend covers follow this place". */
  readonly subtitle: string;
  readonly coverImpact: number;
  /** The primary photo for the previews, or null for the fallback. */
  readonly primary: MediaView | null;
  readonly tone: 'leaf' | 'sun' | 'sky';
  readonly icon: string;
  readonly tiles: readonly PhotoTileView[];
}
