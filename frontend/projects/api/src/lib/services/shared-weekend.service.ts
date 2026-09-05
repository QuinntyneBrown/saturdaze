import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { projectWeekend } from '../api/weekend-projection';
import { WeekendDto } from '../models/weekend.dto';
import { WeekendView } from '../models/weekend-view';
import { ISharedWeekendService } from './shared-weekend.service.contract';

@Injectable({ providedIn: 'root' })
export class SharedWeekendService implements ISharedWeekendService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /**
   * Load — `GET /api/weekends/shared/{token}`, projected like the live weekend.
   *
   * @param {string} token - The share token
   *
   * @returns {Promise<WeekendView>} The read-only weekend
   */
  async load(token: string): Promise<WeekendView> {
    const dto = await firstValueFrom(
      this.http.get<WeekendDto>(`${this.baseUrl}/api/weekends/shared/${encodeURIComponent(token)}`),
    );
    return projectWeekend(dto, 'ready');
  }
}
