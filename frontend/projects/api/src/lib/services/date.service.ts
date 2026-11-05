import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { toCoupleDateView, toDatePlanningView } from '../api/couple-date-projection';
import { CoupleDateDto, CoupleDatesDto } from '../models/couple-date.dto';
import { CoupleDateView, DatePlanningView } from '../models/couple-date-view';
import { MealSlot } from '../models/meal-slot';
import { WeekendDay } from '../models/weekend-day';
import { DateRefusal, IDateService } from './date.service.contract';

/** {@link IDateService} over HTTP. */
@Injectable({ providedIn: 'root' })
export class DateService implements IDateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private url(weekendId: string, rest = ''): string {
    return `${this.baseUrl}/api/weekends/${weekendId}/dates${rest}`;
  }

  async planning(weekendId: string): Promise<DatePlanningView> {
    return toDatePlanningView(await this.call(this.http.get<CoupleDatesDto>(this.url(weekendId))));
  }

  async get(weekendId: string, dateId: string): Promise<CoupleDateView | null> {
    const list = await this.call(this.http.get<CoupleDatesDto>(this.url(weekendId)));
    const date = list.dates.find((d) => d.id === dateId);
    return date ? toCoupleDateView(date) : null;
  }

  plan(
    weekendId: string,
    day: WeekendDay,
    meal: MealSlot,
    attendeeIds: readonly string[],
  ): Promise<CoupleDateView> {
    return this.date(
      this.http.post<CoupleDateDto>(this.url(weekendId), {
        day,
        meal,
        attendeeMemberIds: attendeeIds,
      }),
    );
  }

  move(
    weekendId: string,
    dateId: string,
    day: WeekendDay,
    meal: MealSlot,
  ): Promise<CoupleDateView> {
    return this.date(
      this.http.put<CoupleDateDto>(this.url(weekendId, `/${dateId}`), { day, meal }),
    );
  }

  regenerate(weekendId: string, dateId: string): Promise<CoupleDateView> {
    return this.date(
      this.http.post<CoupleDateDto>(this.url(weekendId, `/${dateId}/regenerate`), null),
    );
  }

  swapRestaurant(weekendId: string, dateId: string): Promise<CoupleDateView> {
    return this.date(
      this.http.post<CoupleDateDto>(this.url(weekendId, `/${dateId}/swap-restaurant`), null),
    );
  }

  swapActivity(weekendId: string, dateId: string): Promise<CoupleDateView> {
    return this.date(
      this.http.post<CoupleDateDto>(this.url(weekendId, `/${dateId}/swap-activity`), null),
    );
  }

  dropActivity(weekendId: string, dateId: string): Promise<CoupleDateView> {
    return this.date(this.http.delete<CoupleDateDto>(this.url(weekendId, `/${dateId}/activity`)));
  }

  async cancel(weekendId: string, dateId: string): Promise<void> {
    await this.call(this.http.delete<void>(this.url(weekendId, `/${dateId}`)));
  }

  private async date(request: Observable<CoupleDateDto>): Promise<CoupleDateView> {
    return toCoupleDateView(await this.call(request));
  }

  /** A 400 or 409 becomes a {@link DateRefusal} carrying the server's message. */
  private async call<T>(request: Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(request);
    } catch (err) {
      if (err instanceof HttpErrorResponse && (err.status === 409 || err.status === 400)) {
        const body = (err.error ?? {}) as {
          detail?: string;
          code?: string;
          errors?: Record<string, string[]>;
        };
        const first = body.errors ? Object.values(body.errors).flat()[0] : undefined;
        throw new DateRefusal(
          body.detail ?? first ?? 'That did not go through.',
          body.code ?? null,
        );
      }
      throw err;
    }
  }
}
