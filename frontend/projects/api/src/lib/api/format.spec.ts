import {
  MONTH_ABBR,
  dateTileParts,
  formatMinutes,
  formatWhen,
  hhmm,
  minutesBetween,
  timeAgo,
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

  it('formats backend TimeOnly values', () => {
    expect(hhmm('09:05:00')).toBe('9:05');
    expect(hhmm('13:30:00')).toBe('13:30');
    expect(toMinutes('01:30:00')).toBe(90);
    expect(minutesBetween('09:00:00', '10:15:00')).toBe(75);
  });

  it('formats minutes as h/m', () => {
    expect(formatMinutes(45)).toBe('45m');
    expect(formatMinutes(60)).toBe('1h');
    expect(formatMinutes(90)).toBe('1h 30m');
  });
});
