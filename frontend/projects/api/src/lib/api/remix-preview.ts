import { ItineraryBlockDto } from '../models/itinerary-block.dto';

/** One row of the D16 Remix preview (L2-084 AC5). */
export interface RemixPreviewRow {
  /** "Saturday morning", "Saturday lunch". */
  readonly when: string;
  /** The stop; a kept one reads "La Marina, kept". */
  readonly title: string;
  /** Locked stops stay through the remix; the rest are re-picked. */
  readonly keep: boolean;
}

const DAY_ORDER = { Saturday: 0, Sunday: 1 } as const;

/**
 * The saved weekend's activities and meals in day and time order, each
 * marked Keep (locked) or New, as D16 previews them.
 */
export function remixPreviewRows(blocks: readonly ItineraryBlockDto[]): RemixPreviewRow[] {
  return blocks
    .filter((b) => b.kind === 'Activity' || b.kind === 'Meal')
    .slice()
    .sort((a, b) => DAY_ORDER[a.day] - DAY_ORDER[b.day] || a.startTime.localeCompare(b.startTime))
    .map((b) => ({
      when: `${b.day} ${partOfDay(b)}`,
      title: b.isLocked ? `${b.title}, kept` : b.title,
      keep: b.isLocked,
    }));
}

function partOfDay(block: ItineraryBlockDto): string {
  const hour = Number(block.startTime.slice(0, 2));
  if (block.kind === 'Meal') return hour < 11 ? 'breakfast' : hour < 15 ? 'lunch' : 'dinner';
  return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
}
