import { InjectionToken, Signal } from '@angular/core';

import { EventSubmissionDto } from '../models/event-submission.dto';
import { ReviewView } from '../models/review-view';
import { SubmitEventRequest } from '../models/submit-event-request';

/**
 * I Event Submissions Service — a family's own suggestions, and the admin
 * review queue.
 */
export interface IEventSubmissionsService {
  /** The caller's own submissions (any status). Reactive — updates after submit/reload. */
  mine(): Signal<ReadonlyArray<EventSubmissionDto>>;

  /** Pending submissions (admin only), oldest first. */
  pending(): Signal<ReadonlyArray<EventSubmissionDto>>;

  /**
   * Review — the review queue as cards, oldest first. Rows approved in this
   * session stay in place as `approved`; rejected rows leave.
   *
   * @returns {Signal<ReviewView>} The result of the operation
   */
  review(): Signal<ReviewView>;

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
   * Approve — `POST /api/events/submissions/{id}/approve`.
   *
   * @param {string} id - The id
   * @param {number | null} driveMinutes - The drive time to publish with
   *
   * @returns {Promise<EventSubmissionDto>} The result of the operation
   */
  approve(id: string, driveMinutes?: number | null): Promise<EventSubmissionDto>;
  /**
   * Reject — `POST /api/events/submissions/{id}/reject`.
   *
   * @param {string} id - The id
   * @param {string | null} reason - The reason shown to the submitter
   *
   * @returns {Promise<EventSubmissionDto>} The result of the operation
   */
  reject(id: string, reason?: string | null): Promise<EventSubmissionDto>;
}

export const EVENT_SUBMISSIONS_SERVICE = new InjectionToken<IEventSubmissionsService>(
  'EVENT_SUBMISSIONS_SERVICE',
);
