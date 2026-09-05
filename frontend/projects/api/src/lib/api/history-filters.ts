import { ChipView } from '../models/chip-view';
import { FilterChip } from '../models/filter-chip';
import { WeekendSummaryDto } from '../models/weekend-summary.dto';
import { addDaysIso, formatDayDate } from './weekend-dates';

/**
 * Client-side history filtering for the Past page. `GET /api/weekends/history`
 * has no filters, so the four chips narrow the loaded rows here.
 */

export const PAST_FILTER_ALL = 'All';
export const PAST_FILTER_FAVOURITES = 'Favourites';
export const PAST_FILTER_THIS_YEAR = 'This year';
export const PAST_FILTER_FIVE_STAR = '5★';

/** The four chips in display order, none active. */
export const PAST_FILTERS: readonly Omit<FilterChip, 'active'>[] = [
  { label: PAST_FILTER_ALL, tone: 'default' },
  { label: PAST_FILTER_FAVOURITES, tone: 'primary', icon: 'heart' },
  { label: PAST_FILTER_THIS_YEAR, tone: 'default' },
  { label: PAST_FILTER_FIVE_STAR, tone: 'sun' },
];

/** Ratings at or below this go in the "Skipping next time" strip. */
export const SKIP_RATING_CEIL = 2;

/** The subset of a history row the filters read. */
export type PastFilterRow = Pick<WeekendSummaryDto, 'isFavourite' | 'weekendOf' | 'rating'>;

/** The chip strip with `active` set on the selected label. */
export function pastFilterChips(active: string): FilterChip[] {
  return PAST_FILTERS.map((f) => ({ ...f, active: f.label === active }));
}

/** True when the row passes the named filter; unknown labels pass everything. */
export function matchesPastFilter(row: PastFilterRow, label: string, year: number): boolean {
  switch (label) {
    case PAST_FILTER_FAVOURITES:
      return row.isFavourite;
    case PAST_FILTER_THIS_YEAR:
      return row.weekendOf.startsWith(`${year}-`);
    case PAST_FILTER_FIVE_STAR:
      return row.rating === 5;
    default:
      return true;
  }
}

/**
 * "The Rec Room · rated 2★ on 6 Apr" for every activity from a weekend rated
 * two stars or fewer, newest weekend first, one chip per activity. The date
 * is the weekend's Sunday, when the rating was given.
 */
export function skippingChips(rows: ReadonlyArray<WeekendSummaryDto>): ChipView[] {
  const seen = new Set<string>();
  const chips: ChipView[] = [];
  const low = rows
    .filter((r) => r.rating !== null && r.rating <= SKIP_RATING_CEIL)
    .sort((a, b) => b.weekendOf.localeCompare(a.weekendOf));
  for (const r of low) {
    const names = r.activityHighlights.length > 0 ? r.activityHighlights : nameOnly(r);
    for (const name of names) {
      if (seen.has(name)) continue;
      seen.add(name);
      chips.push({
        tone: 'warn',
        icon: 'close',
        label: `${name} · rated ${r.rating}★ on ${formatDayDate(addDaysIso(r.weekendOf, 1))}`,
      });
    }
  }
  return chips;
}

/** What to say when a filter other than "All" matches nothing. */
export function filterEmptyCopy(label: string): string | null {
  switch (label) {
    case PAST_FILTER_FAVOURITES:
      return 'No favourites yet. Tap the heart on a weekend you loved.';
    case PAST_FILTER_THIS_YEAR:
      return 'Nothing from this year yet.';
    case PAST_FILTER_FIVE_STAR:
      return 'Nothing rated 5 stars yet.';
    default:
      return null;
  }
}

function nameOnly(r: WeekendSummaryDto): string[] {
  const title = r.title?.trim();
  return title ? [title] : [];
}
