import { MealSlot } from './meal-slot';
import { LocationDto } from './location.dto';
import { PlacePhotoDto } from './place-photo.dto';

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
  readonly slot: MealSlot;
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
  readonly votes?:
    | readonly {
        readonly voterName: string;
        readonly vote: 'up' | 'down' | 'none';
      }[]
    | null;
  /**
   * Locked.
   */
  readonly locked?: boolean;
  /**
   * Location (L2-099); null until the place is backfilled.
   */
  readonly location?: LocationDto | null;
  /**
   * Photo (L2-100); null when the place has none.
   */
  readonly photo?: PlacePhotoDto | null;
}
