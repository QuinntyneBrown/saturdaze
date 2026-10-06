import { LocationDto } from './location.dto';
import { TravelLegDto } from './travel-leg.dto';
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
  /**
   * Stop Number — 1-based among the day's stops away from home (L2-091); null otherwise.
   */
  readonly stopNumber?: number | null;
  /**
   * Stop — where the block happens, for its map pin.
   */
  readonly stop?: LocationDto | null;
  /**
   * Leg Before — the drive into this block from the previous place (L2-090).
   */
  readonly legBefore?: TravelLegDto | null;
}
