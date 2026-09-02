import { SubmissionCard } from './submission-card';

/**
 * Review View — the admin review queue, oldest first.
 */
export interface ReviewView {
  /**
   * Status.
   */
  readonly status: 'loading' | 'empty' | 'ready';
  /**
   * Subtitle — "Three waiting, oldest first. Approving publishes to every family nearby."
   */
  readonly subtitle: string;
  /**
   * Cards.
   */
  readonly cards: readonly SubmissionCard[];
}
