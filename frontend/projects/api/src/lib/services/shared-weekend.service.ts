import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { SharedWeekend } from '../models/shared-weekend';
import { WeekendDto } from '../models/weekend.dto';
import { ISharedWeekendService } from './shared-weekend.service.contract';

@Injectable({ providedIn: 'root' })
export class SharedWeekendService implements ISharedWeekendService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /**
   * Load — `GET /api/weekends/shared/{token}`.
   *
   * @param {string} token - The share token
   *
   * @returns {Promise<SharedWeekend>} The read-only weekend
   */
  async load(token: string): Promise<SharedWeekend> {
    const dto = await firstValueFrom(
      this.http.get<WeekendDto>(
        `${this.baseUrl}/api/weekends/shared/${encodeURIComponent(token)}`,
      ),
    );
    return {
      weekendOf: dto.weekendOf,
      blocks: dto.blocks.map((b) => ({
        day: b.day,
        kind: b.kind,
        title: b.title,
        isLocked: b.isLocked,
        startTime: b.startTime,
      })),
    };
  }
}
