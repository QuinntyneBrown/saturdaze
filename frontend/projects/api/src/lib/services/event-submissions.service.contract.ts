import { InjectionToken, Signal } from '@angular/core';

import { EventSubmissionDto } from '../models/event-submission.dto';
import { SubmitEventRequest } from '../models/submit-event-request';

export interface IEventSubmissionsService {
  /** The caller's own submissions (any status). Reactive — updates after submit/reload. */
  mine(): Signal<ReadonlyArray<EventSubmissionDto>>;

  /** Pending submissions (admin only). */
  pending(): Signal<ReadonlyArray<EventSubmissionDto>>;

  loadMine(): Promise<void>;
  loadPending(): Promise<void>;

  submit(payload: SubmitEventRequest): Promise<EventSubmissionDto>;
  approve(id: string): Promise<EventSubmissionDto>;
  reject(id: string, reason?: string | null): Promise<EventSubmissionDto>;
}

export const EVENT_SUBMISSIONS_SERVICE = new InjectionToken<IEventSubmissionsService>(
  'EVENT_SUBMISSIONS_SERVICE',
);
