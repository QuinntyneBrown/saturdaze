/**
 * The weekend's cover photo (L2-108). Mirrors `Saturdaze.Application.Contracts.CoverDto`.
 */
export interface CoverDto {
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly attribution: string;
  /** "From La Marina" / "Your photo". */
  readonly label: string;
  readonly source: 'default' | 'stop' | 'upload';
  readonly placeId: string | null;
}
