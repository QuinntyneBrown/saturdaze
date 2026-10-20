/** Wire shape of `POST /api/photo-suggestions` (L2-157). */
export interface PhotoSuggestionDto {
  readonly id: string;
  readonly previewUrl: string;
  readonly width: number;
  readonly height: number;
  readonly title: string;
  readonly sourceName: string;
  readonly sourceUrl: string;
  readonly attribution: string;
  readonly licence: string;
}

export interface PhotoSuggestionsDto {
  readonly suggestions: readonly PhotoSuggestionDto[];
}
