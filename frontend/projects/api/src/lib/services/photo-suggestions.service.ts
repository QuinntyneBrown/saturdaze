import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { PhotoSuggestionDto, PhotoSuggestionsDto } from '../models/photo-suggestion.dto';
import { PhotoSuggestionRequest, PhotoSuggestionView } from '../models/photo-suggestion-view';
import { IPhotoSuggestionsService } from './photo-suggestions.service.contract';

/** The preview is API-relative (`/api/photo-suggestions/…`); `<img>` needs it absolute. */
export function toPhotoSuggestion(dto: PhotoSuggestionDto, baseUrl: string): PhotoSuggestionView {
  return {
    id: dto.id,
    media: {
      src: dto.previewUrl.startsWith('/') ? `${baseUrl}${dto.previewUrl}` : dto.previewUrl,
      alt: dto.title,
      width: dto.width,
      height: dto.height,
      credit: dto.attribution,
    },
    title: dto.title,
    sourceName: dto.sourceName,
    sourceUrl: dto.sourceUrl,
    attribution: dto.attribution,
    licence: dto.licence,
  };
}

/** HTTP implementation of `IPhotoSuggestionsService`. */
@Injectable({ providedIn: 'root' })
export class PhotoSuggestionsService implements IPhotoSuggestionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  async find(request: PhotoSuggestionRequest): Promise<readonly PhotoSuggestionView[]> {
    const dto = await firstValueFrom(
      this.http.post<PhotoSuggestionsDto>(`${this.baseUrl}/api/photo-suggestions`, request),
    );
    return dto.suggestions.map((s) => toPhotoSuggestion(s, this.baseUrl));
  }
}
