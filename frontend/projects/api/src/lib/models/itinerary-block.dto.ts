import { BlockKind } from './block-kind';
import { WeekendDay } from './weekend-day';

/**
 * Itinerary Block Dto.
 */
export interface ItineraryBlockDto {
  /**
   * Id.
   */
  readonly id: string;
  /**
   * Day.
   */
  readonly day: WeekendDay;
  /**
   * Start Time.
   */
  readonly startTime: string; // HH:mm:ss
  /**
   * End Time.
   */
  readonly endTime: string;
  /**
   * Kind.
   */
  readonly kind: BlockKind;
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Ref Id.
   */
  readonly refId: string | null;
  /**
   * Is Locked.
   */
  readonly isLocked: boolean;
  /**
   * Reason.
   */
  readonly reason: string;
  /**
   * Sort Order.
   */
  readonly sortOrder: number;
}
