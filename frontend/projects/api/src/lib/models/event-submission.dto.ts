import { EventSubmissionStatus } from './event-submission-status';

/**
 * Server-side shape of one row from `GET /api/events/submissions/*`.
 * Mirrors `Saturdaze.Application.Contracts.EventSubmissionDto`.
 */
export interface EventSubmissionDto {
  readonly id: string;
  readonly title: string;
  readonly startsAtLocal: string;
  readonly endsAtLocal: string | null;
  readonly location: string | null;
  readonly description: string | null;
  readonly costNote: string | null;
  readonly ageRange: string | null;
  readonly sourceUrl: string | null;
  readonly category: string | null;
  readonly driveMinutes: number | null;
  readonly status: EventSubmissionStatus;
  readonly submittedByUserId: string;
  readonly submittedByEmail: string | null;
  readonly submittedAtUtc: string;
  readonly reviewedAtUtc: string | null;
  readonly rejectionReason: string | null;
}
