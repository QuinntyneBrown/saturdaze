import { DayView } from './day-view';

/** Where the weekend page is in its lifecycle. */
export type WeekendStatus = 'loading' | 'empty' | 'ready';

/**
 * Weekend View — the whole Weekend screen: header copy plus the two days.
 * `empty` means nothing has been drafted (a 404 or zero blocks).
 */
export interface WeekendView {
  /**
   * Status.
   */
  readonly status: WeekendStatus;
  /**
   * Id — the weekend id, `null` until one exists.
   */
  readonly id: string | null;
  /**
   * Weekend Of — the Saturday, `YYYY-MM-DD`.
   */
  readonly weekendOf: string | null;
  /**
   * Headline — "This weekend" / "Your first weekend".
   */
  readonly headline: string;
  /**
   * Subtitle.
   */
  readonly subtitle: string;
  /**
   * Days — Saturday then Sunday; empty until the plan is ready.
   */
  readonly days: readonly DayView[];
  /**
   * Block Count.
   */
  readonly blockCount: number;
}
