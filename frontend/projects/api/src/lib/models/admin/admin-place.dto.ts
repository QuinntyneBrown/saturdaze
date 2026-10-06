import { PlacePhotoDto } from '../place-photo.dto';

/**
 * One catalog place as `GET /api/admin/places` lists it (L2-113). Mirrors
 * `Saturdaze.Application.Admin.Photos.AdminPlaceDto`.
 */
export interface AdminPlaceDto {
  readonly kind: 'Activity' | 'Restaurant' | 'LocalEvent';
  readonly id: string;
  readonly name: string;
  readonly photoCount: number;
  readonly photo: PlacePhotoDto | null;
}

/** A page of places. Mirrors `AdminPlacePageDto`. */
export interface AdminPlacePageDto {
  readonly items: readonly AdminPlaceDto[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}
