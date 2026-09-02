import { WeekendSummaryDto } from '../models/weekend-summary.dto';
import {
  PAST_FILTERS,
  filterEmptyCopy,
  matchesPastFilter,
  pastFilterChips,
  skippingChips,
} from './history-filters';

function row(overrides: Partial<WeekendSummaryDto> = {}): WeekendSummaryDto {
  return {
    id: 'w1',
    weekendOf: '2026-05-09',
    isFavourite: false,
    regenerateCount: 0,
    blockCount: 8,
    activityHighlights: ['Bronte Creek', 'Rec Room'],
    title: null,
    rating: null,
    ...overrides,
  };
}

describe('history-filters', () => {
  it('offers the four chips in order and marks the active one', () => {
    expect(PAST_FILTERS.map((f) => f.label)).toEqual(['All', 'Favourites', 'This year', '5★']);
    const chips = pastFilterChips('This year');
    expect(chips.map((c) => c.active)).toEqual([false, false, true, false]);
    expect(chips[1]).toMatchObject({ tone: 'primary', icon: 'heart' });
    expect(chips[3]).toMatchObject({ tone: 'sun' });
  });

  describe('matchesPastFilter', () => {
    it('passes everything for All and unknown labels', () => {
      expect(matchesPastFilter(row(), 'All', 2026)).toBe(true);
      expect(matchesPastFilter(row(), 'Nonsense', 2026)).toBe(true);
    });

    it('keeps only favourites', () => {
      expect(matchesPastFilter(row({ isFavourite: true }), 'Favourites', 2026)).toBe(true);
      expect(matchesPastFilter(row({ isFavourite: false }), 'Favourites', 2026)).toBe(false);
    });

    it('keeps only weekends from the given year', () => {
      expect(matchesPastFilter(row({ weekendOf: '2026-01-03' }), 'This year', 2026)).toBe(true);
      expect(matchesPastFilter(row({ weekendOf: '2025-12-27' }), 'This year', 2026)).toBe(false);
    });

    it('keeps only five-star weekends', () => {
      expect(matchesPastFilter(row({ rating: 5 }), '5★', 2026)).toBe(true);
      expect(matchesPastFilter(row({ rating: 4 }), '5★', 2026)).toBe(false);
      expect(matchesPastFilter(row({ rating: null }), '5★', 2026)).toBe(false);
    });
  });

  describe('skippingChips', () => {
    it('lists activities from poorly rated weekends, newest first, without repeats', () => {
      const chips = skippingChips([
        row({ id: 'old', weekendOf: '2026-03-28', rating: 1, activityHighlights: ['Rec Room'] }),
        row({ id: 'fine', weekendOf: '2026-05-02', rating: 4 }),
        row({ id: 'unrated', weekendOf: '2026-05-09', rating: null }),
        row({
          id: 'low',
          weekendOf: '2026-04-04',
          rating: 2,
          activityHighlights: ['The Rec Room', 'Rec Room'],
        }),
      ]);
      expect(chips.map((c) => c.label)).toEqual([
        'The Rec Room · rated 2★ on 5 Apr',
        'Rec Room · rated 2★ on 5 Apr',
      ]);
      expect(chips[0]).toMatchObject({ tone: 'warn', icon: 'close' });
    });

    it('uses the custom title when a weekend has no highlights', () => {
      const chips = skippingChips([
        row({ rating: 2, activityHighlights: [], title: 'Rainy reset' }),
        row({ id: 'w2', rating: 1, activityHighlights: [], title: null }),
      ]);
      expect(chips.map((c) => c.label)).toEqual(['Rainy reset · rated 2★ on 10 May']);
    });
  });

  it('has copy for each empty filter and none for All', () => {
    expect(filterEmptyCopy('Favourites')).toBe(
      'No favourites yet. Tap the heart on a weekend you loved.',
    );
    expect(filterEmptyCopy('This year')).toBe('Nothing from this year yet.');
    expect(filterEmptyCopy('5★')).toBe('Nothing rated 5 stars yet.');
    expect(filterEmptyCopy('All')).toBeNull();
  });
});
