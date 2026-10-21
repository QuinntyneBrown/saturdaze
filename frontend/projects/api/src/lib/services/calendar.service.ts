import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { CalendarFeedLink, CalendarSettings } from '../models/calendar-settings';
import { ICalendarService } from './calendar.service.contract';

@Injectable({ providedIn: 'root' })
export class CalendarService implements ICalendarService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  settings(): Promise<CalendarSettings> {
    return firstValueFrom(this.http.get<CalendarSettings>(`${this.baseUrl}/api/calendar`));
  }

  async authorizeGoogle(): Promise<string> {
    const body = await firstValueFrom(
      this.http.post<{ authorizationUrl: string }>(
        `${this.baseUrl}/api/calendar/google/authorize`,
        null,
      ),
    );
    return body.authorizationUrl;
  }

  connectGoogle(code: string, state: string): Promise<CalendarSettings> {
    return firstValueFrom(
      this.http.post<CalendarSettings>(`${this.baseUrl}/api/calendar/google/connect`, {
        code,
        state,
      }),
    );
  }

  updateGoogle(readCommitments: boolean): Promise<CalendarSettings> {
    return firstValueFrom(
      this.http.put<CalendarSettings>(`${this.baseUrl}/api/calendar/google`, { readCommitments }),
    );
  }

  async disconnectGoogle(): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/api/calendar/google`));
  }

  createFeed(): Promise<CalendarFeedLink> {
    return firstValueFrom(
      this.http.post<CalendarFeedLink>(`${this.baseUrl}/api/calendar/feed`, null),
    );
  }

  async stopFeed(): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/api/calendar/feed`));
  }
}
