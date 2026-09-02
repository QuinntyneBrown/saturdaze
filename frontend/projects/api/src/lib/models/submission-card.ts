import { DateTile } from './date-tile';
import { EventSubmissionDto } from './event-submission.dto';

/**
 * Submission Card — one card in the review queue. Optional details are
 * `null` when the submitter left them blank (the page renders "Not given").
 */
export interface SubmissionCard {
  /**
   * Id.
   */
  readonly id: string;
  /**
   * State — `approved` once approved in this session; the card collapses.
   */
  readonly state: 'pending' | 'approved';
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Tile.
   */
  readonly tile: DateTile;
  /**
   * When — "Sat 20 Jun · 2:00 to 9:00pm".
   */
  readonly when: string;
  /**
   * Location.
   */
  readonly location: string | null;
  /**
   * Cost.
   */
  readonly cost: string | null;
  /**
   * Ages.
   */
  readonly ages: string | null;
  /**
   * Link.
   */
  readonly link: string | null;
  /**
   * Notes.
   */
  readonly notes: string | null;
  /**
   * Submitter.
   */
  readonly submitter: {
    readonly email: string;
    readonly initial: string;
    readonly ago: string;
  };
  /**
   * Dto — the raw submission, for the approve / reject dialogs.
   */
  readonly dto: EventSubmissionDto;
}
