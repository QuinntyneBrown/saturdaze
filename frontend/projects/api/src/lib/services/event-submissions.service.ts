import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { EventSubmissionDto } from '../models/event-submission.dto';
import { SubmitEventRequest } from '../models/submit-event-request';
import { IEventSubmissionsService } from './event-submissions.service.contract';

@Injectable({ providedIn: 'root' })
export class EventSubmissionsService implements IEventSubmissionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _mine = signal<ReadonlyArray<EventSubmissionDto>>([]);
  private readonly _pending = signal<ReadonlyArray<EventSubmissionDto>>([]);

  mine(): Signal<ReadonlyArray<EventSubmissionDto>> {
    return this._mine.asReadonly();
  }

  pending(): Signal<ReadonlyArray<EventSubmissionDto>> {
    return this._pending.asReadonly();
  }

  async loadMine(): Promise<void> {
    const rows = await firstValueFrom(
      this.http.get<EventSubmissionDto[]>(`${this.baseUrl}/api/events/submissions/mine`),
    );
    this._mine.set(rows);
  }

  async loadPending(): Promise<void> {
    const rows = await firstValueFrom(
      this.http.get<EventSubmissionDto[]>(`${this.baseUrl}/api/events/submissions/pending`),
    );
    this._pending.set(rows);
  }

  async submit(payload: SubmitEventRequest): Promise<EventSubmissionDto> {
    const created = await firstValueFrom(
      this.http.post<EventSubmissionDto>(`${this.baseUrl}/api/events/submissions`, payload),
    );
    this._mine.update((rows) => [created, ...rows]);
    return created;
  }

  async approve(id: string): Promise<EventSubmissionDto> {
    const updated = await firstValueFrom(
      this.http.post<EventSubmissionDto>(`${this.baseUrl}/api/events/submissions/${id}/approve`, null),
    );
    this._pending.update((rows) => rows.filter((r) => r.id !== id));
    return updated;
  }

  async reject(id: string, reason?: string | null): Promise<EventSubmissionDto> {
    const updated = await firstValueFrom(
      this.http.post<EventSubmissionDto>(
        `${this.baseUrl}/api/events/submissions/${id}/reject`,
        { reason: reason ?? null },
      ),
    );
    this._pending.update((rows) => rows.filter((r) => r.id !== id));
    return updated;
  }
}
