import {
  MONTH_ABBR,
  capitalise,
  clock12,
  dateTileParts,
  formatDuration,
  formatMinutes,
  formatWhen,
  hhmm,
  hhmm12,
  initialOf,
  minutesBetween,
  numberWord,
  timeAgo,
  timeRange,
  toMinutes,
} from './format';

describe('format', () => {
  it('has twelve upper-case month abbreviations', () => {
    expect(MONTH_ABBR).toHaveLength(12);
    expect(MONTH_ABBR[4]).toBe('MAY');
  });

  describe('formatWhen', () => {
    it('returns an empty string for an unparseable value', () => {
      expect(formatWhen('not-a-date')).toBe('');
    });

    it('includes the weekday and hour', () => {
      const s = formatWhen('2026-05-16T14:00');
      expect(s).toMatch(/Sat/);
      expect(s).toMatch(/2/);
    });

    it('adds the month/day for the date style and the year for full', () => {
      expect(formatWhen('2026-05-16T14:00', 'date')).toMatch(/May/);
      expect(formatWhen('2026-05-16T14:00', 'full')).toMatch(/2026/);
    });
  });

  it('splits a local date-time into tile parts', () => {
    expect(dateTileParts('2026-05-16T14:00')).toEqual({ day: '16', mon: 'MAY' });
    expect(dateTileParts('garbage')).toEqual({ day: '', mon: '' });
  });

  it('describes how long ago something happened', () => {
    const now = Date.parse('2026-05-16T12:00:00Z');
    expect(timeAgo('2026-05-16T11:30:00Z', now)).toBe('just now');
    expect(timeAgo('2026-05-16T09:00:00Z', now)).toBe('3 hours ago');
    expect(timeAgo('2026-05-16T11:00:00Z', now)).toBe('1 hour ago');
    expect(timeAgo('2026-05-14T12:00:00Z', now)).toBe('2 days ago');
    expect(timeAgo('nope', now)).toBe('');
  });

  it('formats backend TimeOnly values on the 24-hour clock', () => {
    expect(hhmm('09:05:00')).toBe('9:05');
    expect(hhmm('13:30:00')).toBe('13:30');
    expect(toMinutes('01:30:00')).toBe(90);
    expect(minutesBetween('09:00:00', '10:15:00')).toBe(75);
  });

  it('formats TimeOnly values on the 12-hour clock', () => {
    expect(hhmm12('09:05:00')).toBe('9:05');
    expect(hhmm12('12:00:00')).toBe('12:00');
    expect(hhmm12('13:30:00')).toBe('1:30');
    expect(hhmm12('00:15')).toBe('12:15');
    expect(clock12('09:15:00')).toBe('9:15am');
    expect(clock12('14:00')).toBe('2:00pm');
    expect(clock12('12:00')).toBe('12:00pm');
  });

  it('writes a 12-hour range with the suffix only where it is needed', () => {
    expect(timeRange('09:00:00', '10:00:00')).toBe('9:00 to 10:00');
    expect(timeRange('17:00', '18:00')).toBe('5:00 to 6:00pm');
    expect(timeRange('14:00', '21:00')).toBe('2:00 to 9:00pm');
    expect(timeRange('12:00', '13:30')).toBe('12:00 to 1:30pm');
    expect(timeRange('10:00', '14:00')).toBe('10:00am to 2:00pm');
    expect(timeRange('11:00', '13:00')).toBe('11:00am to 1:00pm');
  });

  it('formats minutes as h/m', () => {
    expect(formatMinutes(45)).toBe('45m');
    expect(formatMinutes(60)).toBe('1h');
    expect(formatMinutes(90)).toBe('1h 30m');
  });

  it('formats block durations the way the rail shows them', () => {
    expect(formatDuration(30)).toBe('30m');
    expect(formatDuration(60)).toBe('60m');
    expect(formatDuration(75)).toBe('75m');
    expect(formatDuration(90)).toBe('90m');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(150)).toBe('2h 30m');
  });

  it('spells small numbers and leaves large ones as digits', () => {
    expect(numberWord(0)).toBe('zero');
    expect(numberWord(1)).toBe('one');
    expect(numberWord(12)).toBe('twelve');
    expect(numberWord(13)).toBe('13');
    expect(capitalise(numberWord(3))).toBe('Three');
    expect(capitalise('')).toBe('');
  });

  it('takes an upper-case initial', () => {
    expect(initialOf('quinn')).toBe('Q');
    expect(initialOf('  Sara ')).toBe('S');
    expect(initialOf('')).toBe('');
    expect(initialOf(null)).toBe('');
  });
});
