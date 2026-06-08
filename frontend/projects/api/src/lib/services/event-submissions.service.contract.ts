import { InjectionToken, Signal } from '@angular/core';

import { EventSubmissionDto } from '../models/event-submission.dto';
import { SubmitEventRequest } from '../models/submit-event-request';

/**
 * I Event Submissions Service.
 */
export interface IEventSubmissionsService {
  /** The caller's own submissions (any status). Reactive — updates after submit/reload. */
  mine(): Signal<ReadonlyArray<EventSubmissionDto>>;

  /** Pending submissions (admin only). */
  pending(): Signal<ReadonlyArray<EventSubmissionDto>>;

  /**
   * Load Mine.
   *
   * @returns {Promise<void>} The result of the operation
   */
  loadMine(): Promise<void>;
  /**
   * Load Pending.
   *
   * @returns {Promise<void>} The result of the operation
   */
  loadPending(): Promise<void>;

  /**
   * Submit.
   *
   * @param {SubmitEventRequest} payload - The payload
   *
   * @returns {Promise<EventSubmissionDto>} The result of the operation
   */
  submit(payload: SubmitEventRequest): Promise<EventSubmissionDto>;
  /**
   * Approve.
   *
   * @param {string} id - The id
   *
   * @returns {Promise<EventSubmissionDto>} The result of the operation
   */
  approve(id: string): Promise<EventSubmissionDto>;
  /**
   * Reject.
   *
   * @param {string} id - The id
   *
   * @returns {Promise<EventSubmissionDto>} The result of the operation
   */
  reject(id: string, reason?: string | null): Promise<EventSubmissionDto>;
}

export const EVENT_SUBMISSIONS_SERVICE = new InjectionToken<IEventSubmissionsService>(
  'EVENT_SUBMISSIONS_SERVICE',
);
