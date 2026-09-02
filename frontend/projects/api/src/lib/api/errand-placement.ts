import { ErrandPlacement } from '../models/errand-placement';
import { ItineraryBlockDto } from '../models/itinerary-block.dto';
import { WeekendDto } from '../models/weekend.dto';
import { hhmm } from './format';

/**
 * Where the errand just added landed. The add endpoint returns the whole
 * weekend, so the new block is found by diffing block ids against the
 * weekend as it was before the call; when there is nothing to diff against
 * the newest errand with a matching description is used instead.
 */
export function placementFor(
  before: WeekendDto | null,
  after: WeekendDto,
  description: string,
): ErrandPlacement | null {
  const errandBlocks = after.blocks.filter((b) => b.kind === 'Errand');
  const block = freshBlock(before, errandBlocks) ?? byDescription(after, errandBlocks, description);
  if (!block) return null;
  return {
    description,
    day: block.day,
    time: hhmm(block.startTime),
    endTime: hhmm(block.endTime),
    blockId: block.id,
  };
}

function freshBlock(
  before: WeekendDto | null,
  errandBlocks: ReadonlyArray<ItineraryBlockDto>,
): ItineraryBlockDto | null {
  if (!before) return null;
  const known = new Set(before.blocks.map((b) => b.id));
  return errandBlocks.find((b) => !known.has(b.id)) ?? null;
}

function byDescription(
  after: WeekendDto,
  errandBlocks: ReadonlyArray<ItineraryBlockDto>,
  description: string,
): ItineraryBlockDto | null {
  const wanted = description.trim().toLowerCase();
  const errand = [...after.errands]
    .reverse()
    .find((e) => e.description.trim().toLowerCase() === wanted);
  if (!errand) return null;
  return errandBlocks.find((b) => b.refId === errand.id) ?? null;
}
