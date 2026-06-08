/**
 * Restaurant Dto.
 */
export interface RestaurantDto {
  /**
   * Id.
   */
  readonly id: string;
  /**
   * Name.
   */
  readonly name: string;
  /**
   * Style.
   */
  readonly style: string;
  /**
   * Slot.
   */
  readonly slot: 'Lunch' | 'Dinner';
  /**
   * Wife Approved.
   */
  readonly wifeApproved: boolean;
  /**
   * Drive Minutes.
   */
  readonly driveMinutes: number;
  /**
   * Notes.
   */
  readonly notes: string;
  /**
   * Menu Url.
   */
  readonly menuUrl?: string | null;
  /**
   * Votes.
   */
  readonly votes?: ReadonlyArray<{
    readonly voterName: string;
    readonly vote: 'up' | 'down' | 'none';
  }> | null;
  /**
   * Locked.
   */
  readonly locked?: boolean;
}
