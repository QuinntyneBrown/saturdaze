/**
 * Media View — a photo ready for a card's media frame (`sd-media`).
 */
export interface MediaView {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  /** Attribution shown on the image, e.g. "Photo · Jo Doe". */
  readonly credit: string;
}
