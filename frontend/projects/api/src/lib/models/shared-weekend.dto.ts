import { ItineraryBlockDto } from './itinerary-block.dto';
import { WeekendDto } from './weekend.dto';

/**
 * `GET /api/weekends/shared/{token}` (L2-086 AC7): the weekend minus the
 * family's notes, errands, home, rating, favourite flag, regeneration count and
 * block reasons.
 */
export type SharedWeekendDto = Omit<
  WeekendDto,
  'isFavourite' | 'notes' | 'regenerateCount' | 'rating' | 'errands' | 'home' | 'blocks'
> & {
  readonly blocks: readonly Omit<ItineraryBlockDto, 'reason'>[];
};
