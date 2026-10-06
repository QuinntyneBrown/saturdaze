import { MediaView } from '../models/media-view';
import { PlacePhotoDto } from '../models/place-photo.dto';

/** The card media for a place's photo, or null for the fallback tile (L2-094). */
export function toMedia(photo: PlacePhotoDto | null | undefined): MediaView | null {
  if (!photo) return null;
  return {
    src: photo.url,
    alt: photo.alt,
    width: photo.width,
    height: photo.height,
    credit: photo.attribution,
  };
}
