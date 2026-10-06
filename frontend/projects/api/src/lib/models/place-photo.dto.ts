/**
 * A place's primary photo (L2-088). Mirrors
 * `Saturdaze.Application.Contracts.PlacePhotoDto`.
 */
export interface PlacePhotoDto {
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly attribution: string;
}
