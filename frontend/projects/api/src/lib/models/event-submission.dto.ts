import { EventSubmissionStatus } from './event-submission-status';

/**
 * Server-side shape of one row from `GET /api/events/submissions/*`.
 * Mirrors `Saturdaze.Application.Contracts.EventSubmissionDto`.
 */
export interface EventSubmissionDto {
  /**
   * Id.
   */
  readonly id: string;
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Starts At Local.
   */
  readonly startsAtLocal: string;
  /**
   * Ends At Local.
   */
  readonly endsAtLocal: string | null;
  /**
   * Location.
   */
  readonly location: string | null;
  /**
   * Description.
   */
  readonly description: string | null;
  /**
   * Cost Note.
   */
  readonly costNote: string | null;
  /**
   * Age Range.
   */
  readonly ageRange: string | null;
  /**
   * Source Url.
   */
  readonly sourceUrl: string | null;
  /**
   * Category.
   */
  readonly category: string | null;
  /**
   * Drive Minutes.
   */
  readonly driveMinutes: number | null;
  /**
   * Status.
   */
  readonly status: EventSubmissionStatus;
  /**
   * Submitted By User Id.
   */
  readonly submittedByUserId: string;
  /**
   * Submitted By Email.
   */
  readonly submittedByEmail: string | null;
  /**
   * Submitted At Utc.
   */
  readonly submittedAtUtc: string;
  /**
   * Reviewed At Utc.
   */
  readonly reviewedAtUtc: string | null;
  /**
   * Rejection Reason.
   */
  readonly rejectionReason: string | null;
}
