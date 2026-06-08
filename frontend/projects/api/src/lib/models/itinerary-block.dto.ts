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
  readonly day: 'Saturday' | 'Sunday';
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
  readonly kind: 'Workout' | 'Activity' | 'Meal' | 'Drive' | 'Downtime' | 'Commitment' | 'Errand';
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
