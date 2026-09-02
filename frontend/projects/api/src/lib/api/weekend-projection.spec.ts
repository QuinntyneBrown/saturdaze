import { WeatherForecastDto } from '../models/weather-forecast.dto';
import { block, weekendDto } from '../testing/weekend-fixture';
import {
  blockIcon,
  bySortThenStart,
  dayKeeping,
  projectDay,
  projectWeekend,
  toBlockRow,
  weekendSubtitle,
} from './weekend-projection';

function forecast(tags: string[], extra: Partial<WeatherForecastDto> = {}): WeatherForecastDto {
  return {
    date: '2026-05-16',
    tags,
    highCelsius: 22,
    lowCelsius: 14,
    precipitationMm: 0,
    unavailable: false,
    ...extra,
  };
}

describe('weekend-projection', () => {
  describe('projectWeekend', () => {
    it('is loading with the loading copy when there is no weekend yet', () => {
      const view = projectWeekend(null);
      expect(view.status).toBe('loading');
      expect(view.headline).toBe('This weekend');
      expect(view.subtitle).toBe('Pulling the latest plan.');
      expect(view.id).toBeNull();
      expect(view.days).toEqual([]);
      expect(view.blockCount).toBe(0);
    });

    it('is empty with the first-weekend copy when asked', () => {
      const view = projectWeekend(null, 'empty');
      expect(view.status).toBe('empty');
      expect(view.headline).toBe('Your first weekend');
      expect(view.subtitle).toBe('Nothing is drafted yet. Planning takes a few seconds.');
    });

    it('treats a weekend with zero blocks as empty but keeps its id', () => {
      const view = projectWeekend(weekendDto({ blocks: [] }));
      expect(view.status).toBe('empty');
      expect(view.id).toBe('w1');
      expect(view.weekendOf).toBe('2026-05-16');
      expect(view.headline).toBe('Your first weekend');
    });

    it('projects a ready weekend with both days and the weather subtitle', () => {
      const view = projectWeekend(weekendDto());
      expect(view.status).toBe('ready');
      expect(view.headline).toBe('This weekend');
      expect(view.subtitle).toBe(
        'Sunny Saturday for Lavender fields, a cloudy Sunday for The Rec Room.',
      );
      expect(view.days.map((d) => d.day)).toEqual(['Saturday', 'Sunday']);
      expect(view.blockCount).toBe(8);
    });

    it('can be forced ready for a share link even without blocks', () => {
      expect(projectWeekend(weekendDto({ blocks: [] }), 'ready').status).toBe('ready');
    });
  });

  describe('projectDay', () => {
    it('sorts by sortOrder then start time', () => {
      const dto = weekendDto({
        blocks: [
          block({ id: 'late', startTime: '15:00:00', endTime: '16:00:00', sortOrder: 1 }),
          block({ id: 'tie-b', startTime: '12:00:00', endTime: '13:00:00', sortOrder: 0 }),
          block({ id: 'tie-a', startTime: '09:00:00', endTime: '10:00:00', sortOrder: 0 }),
        ],
      });
      expect(projectDay(dto, 'Saturday').blocks.map((b) => b.id)).toEqual([
        'tie-a',
        'tie-b',
        'late',
      ]);
      expect(bySortThenStart(dto.blocks[1]!, dto.blocks[2]!)).toBeGreaterThan(0);
    });

    it('builds the header meta from the date and forecast', () => {
      const sat = projectDay(weekendDto(), 'Saturday');
      expect(sat.dateIso).toBe('2026-05-16');
      expect(sat.dateLabel).toBe('16 May');
      expect(sat.meta).toBe('16 May · 22° / 14° · Light breeze, good for outdoors');
      expect(sat.weather).toEqual({
        day: 'Saturday',
        icon: 'sun',
        hi: '22',
        lo: '14',
        note: 'Light breeze, good for outdoors',
      });
    });

    it('drops the temperatures when there is no forecast', () => {
      const sun = projectDay(weekendDto({ weather: [] }), 'Sunday');
      expect(sun.meta).toBe('17 May · Forecast pending');
      expect(sun.weather.hi).toBe('—');
    });

    it('lists what a regenerate keeps: commitments and locked blocks, never drives', () => {
      expect(projectDay(weekendDto(), 'Saturday').keeping).toEqual(['Swim lessons 9:00']);
      expect(projectDay(weekendDto(), 'Sunday').keeping).toEqual(['The Rec Room 13:30']);
      expect(
        dayKeeping([
          block({ kind: 'Drive', isLocked: true }),
          block({ id: 'x', title: 'Zoo', isLocked: true, startTime: '10:00:00' }),
        ]),
      ).toEqual(['Zoo 10:00']);
    });

    it('is locked only when every lockable block is locked', () => {
      expect(projectDay(weekendDto(), 'Saturday').locked).toBe(false);
      const allLocked = weekendDto({
        blocks: [
          block({ id: 'c1', kind: 'Commitment', isLocked: true }),
          block({ id: 'd1', kind: 'Drive', startTime: '10:00:00', endTime: '10:30:00' }),
          block({ id: 'a1', isLocked: true, startTime: '11:00:00', endTime: '12:00:00' }),
          block({
            id: 'm1',
            kind: 'Meal',
            isLocked: true,
            startTime: '12:00:00',
            endTime: '13:00:00',
          }),
        ],
      });
      expect(projectDay(allLocked, 'Saturday').locked).toBe(true);
      const noLockable = weekendDto({
        blocks: [block({ id: 'c1', kind: 'Commitment', isLocked: true })],
      });
      expect(projectDay(noLockable, 'Saturday').locked).toBe(false);
    });
  });

  describe('toBlockRow', () => {
    const day = projectDay(weekendDto(), 'Saturday');
    const row = (id: string) => day.blocks.find((b) => b.id === id)!;

    it('formats time, range and duration the way the rail shows them', () => {
      expect(row('b1')).toMatchObject({
        time: '11:00',
        timeRange: '11:00am to 1:00pm',
        duration: '2h',
        durationMinutes: 120,
      });
      expect(row('m1').duration).toBe('75m');
      expect(row('c1').time).toBe('9:00');
    });

    it('marks the first activity as the day highlight with the primary chip', () => {
      expect(row('b1').highlight).toBe(true);
      expect(row('b1').chips).toContainEqual({ tone: 'primary', label: 'Day highlight' });
      expect(row('m1').highlight).toBe(false);
      expect(projectDay(weekendDto(), 'Sunday').blocks.find((b) => b.highlight)?.id).toBe('s2');
    });

    it('hands the drive minutes to the activity that follows the drive', () => {
      expect(row('b1').chips).toContainEqual({ tone: 'sky', icon: 'car', label: '45 min drive' });
      expect(row('d1')).toMatchObject({ drive: true, subtitle: null, chips: [], lockable: false });
      expect(row('m1').chips.some((c) => c.label.endsWith('drive'))).toBe(false);
    });

    it('never lets a commitment be swapped or locked and replaces the planner boilerplate', () => {
      expect(row('c1')).toMatchObject({
        commitment: true,
        swappable: false,
        lockable: false,
        locked: true,
        icon: 'lock',
        subtitle: 'Every Saturday · locked in',
        reason: 'fixed commitment',
        chips: [{ tone: 'accent', icon: 'lock', label: 'Commitment' }],
      });
      const custom = toBlockRow(
        block({ kind: 'Commitment', day: 'Sunday', reason: 'Church, then coffee' }),
        [],
      );
      expect(custom.subtitle).toBe('Church, then coffee');
      const blank = toBlockRow(block({ kind: 'Commitment', day: 'Sunday', reason: '' }), []);
      expect(blank.subtitle).toBe('Every Sunday · locked in');
      expect(blank.reason).toBeNull();
    });

    it('reads errand completion from the errands list', () => {
      expect(row('e1')).toMatchObject({
        errand: true,
        done: false,
        swappable: false,
        lockable: true,
        icon: 'bag',
        chips: [{ tone: 'indoor', label: 'Errand' }],
      });
      const done = toBlockRow(block({ kind: 'Errand', refId: 'err1' }), [
        { id: 'err1', description: 'Costco run', estimatedMinutes: 45, done: true },
      ]);
      expect(done.done).toBe(true);
      expect(done.chips).toEqual([
        { tone: 'indoor', label: 'Errand' },
        { tone: 'accent', icon: 'check', label: 'Done' },
      ]);
    });

    it('locks an activity out of swapping and shows the Locked chip', () => {
      const locked = projectDay(weekendDto(), 'Sunday').blocks.find((b) => b.id === 's2')!;
      expect(locked).toMatchObject({ locked: true, swappable: false, lockable: true });
      expect(locked.chips[0]).toEqual({ tone: 'accent', icon: 'lock', label: 'Locked' });
      expect(row('b1')).toMatchObject({ locked: false, swappable: true });
    });
  });

  describe('weekendSubtitle', () => {
    const sunny = forecast(['sunny', 'warm']);
    const cloudy = forecast(['mild'], { date: '2026-05-17' });

    it('names both highlights with their weather', () => {
      expect(weekendSubtitle(sunny, cloudy, 'the lavender', 'the Rec Room')).toBe(
        'Sunny Saturday for the lavender, a cloudy Sunday for the Rec Room.',
      );
    });

    it('falls back to a quiet day when a day has no activity', () => {
      expect(weekendSubtitle(sunny, cloudy, 'the lavender', null)).toBe(
        'Sunny Saturday for the lavender, a quiet Sunday at home.',
      );
      expect(weekendSubtitle(sunny, cloudy, null, 'the Rec Room')).toBe(
        'A quiet Saturday at home, a cloudy Sunday for the Rec Room.',
      );
      expect(weekendSubtitle(sunny, cloudy, null, null)).toBe(
        'A quiet Saturday at home, a quiet Sunday at home.',
      );
    });

    it('drops the adjective when there is no forecast', () => {
      expect(weekendSubtitle(null, null, 'the lavender', 'the Rec Room')).toBe(
        'Saturday for the lavender, Sunday for the Rec Room.',
      );
    });
  });

  describe('blockIcon', () => {
    it('picks by kind, with home and title heuristics', () => {
      expect(blockIcon('Meal', 'Lunch at La Marina')).toBe('fork');
      expect(blockIcon('Meal', 'Breakfast at home')).toBe('home');
      expect(blockIcon('Downtime', 'Quiet time at home')).toBe('home');
      expect(blockIcon('Downtime', 'Nap in the car')).toBe('bed');
      expect(blockIcon('Drive', 'Drive home')).toBe('car');
      expect(blockIcon('Commitment', 'Swim')).toBe('lock');
      expect(blockIcon('Errand', 'Costco')).toBe('bag');
      expect(blockIcon('Activity', 'Cirque Mechanics matinée')).toBe('ticket');
      expect(blockIcon('Activity', 'The Rec Room')).toBe('popcorn');
      expect(blockIcon('Activity', 'Lavender fields')).toBe('tree');
    });
  });
});
