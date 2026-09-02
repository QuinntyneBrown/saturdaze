import { BlockKind } from './block-kind';
import { ChipView } from './chip-view';
import { WeekendDay } from './weekend-day';

/**
 * Block Row — one `sd-block` in a day's timeline, fully resolved for
 * rendering. Flags rather than a tone: the component maps them onto the
 * mock's `block--commitment` / `block--locked` / `block--drive` /
 * `block--errand` / `block--done` modifiers and decides which actions to
 * offer.
 */
export interface BlockRow {
  /**
   * Id — the itinerary block id.
   */
  readonly id: string;
  /**
   * Day.
   */
  readonly day: WeekendDay;
  /**
   * Kind.
   */
  readonly kind: BlockKind;
  /**
   * Ref Id — the activity / errand / restaurant the block points at.
   */
  readonly refId: string | null;
  /**
   * Time — the 24-hour clock shown in the rail, "9:00" / "17:00".
   */
  readonly time: string;
  /**
   * Time Range — "11:00am to 1:00pm" / "5:00 to 6:00pm" for dialogs.
   */
  readonly timeRange: string;
  /**
   * Duration — "60m" / "2h".
   */
  readonly duration: string;
  /**
   * Duration Minutes.
   */
  readonly durationMinutes: number;
  /**
   * Icon — an `sd-icon` name.
   */
  readonly icon: string;
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Subtitle — the one-line sub under the title; `null` for drive rows.
   */
  readonly subtitle: string | null;
  /**
   * Reason — the planner's justification, for the "Why this" well.
   */
  readonly reason: string | null;
  /**
   * Chips — only the chips that apply (Commitment, Locked, drive, highlight…).
   */
  readonly chips: readonly ChipView[];
  /**
   * Locked.
   */
  readonly locked: boolean;
  /**
   * Commitment — a fixed family commitment; never swappable or lockable.
   */
  readonly commitment: boolean;
  /**
   * Errand.
   */
  readonly errand: boolean;
  /**
   * Done — errand rows only.
   */
  readonly done: boolean;
  /**
   * Drive — a transit row between two places.
   */
  readonly drive: boolean;
  /**
   * Highlight — the day's first activity.
   */
  readonly highlight: boolean;
  /**
   * Swappable — the server only swaps unlocked activity blocks.
   */
  readonly swappable: boolean;
  /**
   * Lockable — everything except commitments and drives.
   */
  readonly lockable: boolean;
}
