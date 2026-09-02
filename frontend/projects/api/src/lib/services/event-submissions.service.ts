import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { capitalise, clock12, initialOf, numberWord, timeAgo, timeRange } from '../api/format';
import { formatEventDate, monthAbbr, parseIsoDate } from '../api/weekend-dates';
import { DateTile } from '../models/date-tile';
import { EventSubmissionDto } from '../models/event-submission.dto';
import { ReviewView } from '../models/review-view';
import { SubmissionCard } from '../models/submission-card';
import { SubmitEventRequest } from '../models/submit-event-request';
import { IEventSubmissionsService } from './event-submissions.service.contract';

const SUBTITLE_EMPTY = 'Nothing waiting. New suggestions show up here as families send them.';
const SUBTITLE_LOADING = 'Pulling the latest submissions.';
const UNKNOWN_SUBMITTER = 'Unknown submitter';

/** "Three waiting, oldest first. Approving publishes to every family nearby." */
export function reviewSubtitle(waiting: number): string {
  if (waiting === 0) return SUBTITLE_EMPTY;
  return `${capitalise(numberWord(waiting))} waiting, oldest first. Approving publishes to every family nearby.`;
}

function tileFor(dateIso: string): DateTile {
  const d = parseIsoDate(dateIso);
  return { day: String(d.getUTCDate()), mon: monthAbbr(d) };
}

/**
 * "Sat 20 Jun · 2:00 to 9:00pm" — or "Sat 20 Jun · 2:00pm" without an end,
 * and both dates when the event ends on another day.
 */
export function submissionWhen(dto: EventSubmissionDto): string {
  const startDate = dto.startsAtLocal.substring(0, 10);
  const startTime = dto.startsAtLocal.substring(11, 16) || '00:00';
  if (!dto.endsAtLocal) return `${formatEventDate(startDate)} · ${clock12(startTime)}`;
  const endDate = dto.endsAtLocal.substring(0, 10);
  const endTime = dto.endsAtLocal.substring(11, 16) || '00:00';
  if (endDate !== startDate) {
    return `${formatEventDate(startDate)} ${clock12(startTime)} to ${formatEventDate(endDate)} ${clock12(endTime)}`;
  }
  return `${formatEventDate(startDate)} · ${timeRange(startTime, endTime)}`;
}

function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * To Card.
 */
export function toSubmissionCard(
  dto: EventSubmissionDto,
  state: SubmissionCard['state'],
  now: number = Date.now(),
): SubmissionCard {
  const email = blankToNull(dto.submittedByEmail);
  return {
    id: dto.id,
    state,
    title: dto.title,
    tile: tileFor(dto.startsAtLocal.substring(0, 10)),
    when: submissionWhen(dto),
    location: blankToNull(dto.location),
    cost: blankToNull(dto.costNote),
    ages: blankToNull(dto.ageRange),
    link: blankToNull(dto.sourceUrl),
    notes: blankToNull(dto.description),
    submitter: {
      email: email ?? UNKNOWN_SUBMITTER,
      initial: initialOf(email ?? '?'),
      ago: timeAgo(dto.submittedAtUtc, now),
    },
    dto,
  };
}

function oldestFirst(a: EventSubmissionDto, b: EventSubmissionDto): number {
  return a.submittedAtUtc.localeCompare(b.submittedAtUtc);
}

@Injectable({ providedIn: 'root' })
export class EventSubmissionsService implements IEventSubmissionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _mine = signal<ReadonlyArray<EventSubmissionDto>>([]);
  /** Everything loaded for review, oldest first; rejected rows are removed. */
  private readonly _queue = signal<ReadonlyArray<EventSubmissionDto>>([]);
  private readonly _approvedIds = signal<ReadonlySet<string>>(new Set());
  private readonly _queueLoaded = signal(false);

  private readonly _pending = computed<ReadonlyArray<EventSubmissionDto>>(() => {
    const approved = this._approvedIds();
    return this._queue().filter((r) => !approved.has(r.id));
  });

  private readonly _review = computed<ReviewView>(() => {
    if (!this._queueLoaded()) return { status: 'loading', subtitle: SUBTITLE_LOADING, cards: [] };
    const approved = this._approvedIds();
    const cards = this._queue().map((dto) =>
      toSubmissionCard(dto, approved.has(dto.id) ? 'approved' : 'pending'),
    );
    const waiting = cards.filter((c) => c.state === 'pending').length;
    return {
      status: cards.length === 0 ? 'empty' : 'ready',
      subtitle: reviewSubtitle(waiting),
      cards,
    };
  });

  /**
   * Mine.
   *
   * @returns {Signal<ReadonlyArray<EventSubmissionDto>>} The result of the operation
   */
  mine(): Signal<ReadonlyArray<EventSubmissionDto>> {
    return this._mine.asReadonly();
  }

  /**
   * Pending.
   *
   * @returns {Signal<ReadonlyArray<EventSubmissionDto>>} The result of the operation
   */
  pending(): Signal<ReadonlyArray<EventSubmissionDto>> {
    return this._pending;
  }

  /**
   * Review.
   *
   * @returns {Signal<ReviewView>} The result of the operation
   */
  review(): Signal<ReviewView> {
    return this._review;
  }

  /**
   * Load Mine.
   *
   * @returns {Promise<void>} The result of the operation
   */
  async loadMine(): Promise<void> {
    const rows = await firstValueFrom(
      this.http.get<EventSubmissionDto[]>(`${this.baseUrl}/api/events/submissions/mine`),
    );
    this._mine.set(rows ?? []);
  }

  /**
   * Load Pending — resets the queue and forgets this session's approvals.
   *
   * @returns {Promise<void>} The result of the operation
   */
  async loadPending(): Promise<void> {
    const rows = await firstValueFrom(
      this.http.get<EventSubmissionDto[]>(`${this.baseUrl}/api/events/submissions/pending`),
    );
    this._queue.set([...(rows ?? [])].sort(oldestFirst));
    this._approvedIds.set(new Set());
    this._queueLoaded.set(true);
  }

  /**
   * Submit.
   *
   * @param {SubmitEventRequest} payload - The payload
   *
   * @returns {Promise<EventSubmissionDto>} The result of the operation
   */
  async submit(payload: SubmitEventRequest): Promise<EventSubmissionDto> {
    const created = await firstValueFrom(
      this.http.post<EventSubmissionDto>(`${this.baseUrl}/api/events/submissions`, payload),
    );
    this._mine.update((rows) => [created, ...rows]);
    return created;
  }

  /**
   * Approve — the card stays in the queue, collapsed as approved.
   *
   * @param {string} id - The id
   * @param {number | null} driveMinutes - The drive time to publish with
   *
   * @returns {Promise<EventSubmissionDto>} The result of the operation
   */
  async approve(id: string, driveMinutes: number | null = null): Promise<EventSubmissionDto> {
    const updated = await firstValueFrom(
      this.http.post<EventSubmissionDto>(
        `${this.baseUrl}/api/events/submissions/${id}/approve`,
        driveMinutes == null ? null : { driveMinutes },
      ),
    );
    this._queue.update((rows) => rows.map((r) => (r.id === id ? updated : r)));
    this._approvedIds.update((ids) => new Set([...ids, id]));
    return updated;
  }

  /**
   * Reject — the card leaves the queue.
   *
   * @param {string} id - The id
   * @param {string | null} reason - The reason shown to the submitter
   *
   * @returns {Promise<EventSubmissionDto>} The result of the operation
   */
  async reject(id: string, reason?: string | null): Promise<EventSubmissionDto> {
    const updated = await firstValueFrom(
      this.http.post<EventSubmissionDto>(`${this.baseUrl}/api/events/submissions/${id}/reject`, {
        reason: reason?.trim() || null,
      }),
    );
    this._queue.update((rows) => rows.filter((r) => r.id !== id));
    return updated;
  }
}
