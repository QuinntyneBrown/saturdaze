import {
  addDaysIso,
  formatWeekendRange,
  formatWeekendSpan,
  localIsoDate,
  parseIsoDate,
  toIsoDate,
  upcomingSaturdayIso,
  weekendDates,
  weekendDayIso,
} from './weekend-dates';

describe('weekend-dates', () => {
  it('parses and formats ISO dates without timezone drift', () => {
    const d = parseIsoDate('2026-05-16');
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(4);
    expect(d.getUTCDate()).toBe(16);
    expect(toIsoDate(d)).toBe('2026-05-16');
  });

  it('adds days across a month boundary', () => {
    expect(addDaysIso('2026-05-30', 2)).toBe('2026-06-01');
    expect(addDaysIso('2026-05-01', -1)).toBe('2026-04-30');
  });

  it('formats the local calendar date', () => {
    expect(localIsoDate(new Date(2026, 4, 3, 23, 59))).toBe('2026-05-03');
  });

  describe('upcomingSaturdayIso (mirrors the backend rule)', () => {
    it('is today on a Saturday', () => {
      expect(upcomingSaturdayIso(new Date(2026, 4, 16, 10))).toBe('2026-05-16');
    });

    it('is yesterday on a Sunday — the weekend already started', () => {
      expect(upcomingSaturdayIso(new Date(2026, 4, 17, 10))).toBe('2026-05-16');
    });

    it('rolls forward to the coming Saturday mid-week', () => {
      expect(upcomingSaturdayIso(new Date(2026, 4, 13, 10))).toBe('2026-05-16');
      expect(upcomingSaturdayIso(new Date(2026, 4, 11, 10))).toBe('2026-05-16');
      expect(upcomingSaturdayIso(new Date(2026, 4, 15, 23))).toBe('2026-05-16');
    });
  });

  it('returns Saturday and Sunday for a weekend', () => {
    const [sat, sun] = weekendDates('2026-05-16');
    expect(toIsoDate(sat)).toBe('2026-05-16');
    expect(toIsoDate(sun)).toBe('2026-05-17');
    expect(weekendDayIso('2026-05-16', 'Saturday')).toBe('2026-05-16');
    expect(weekendDayIso('2026-05-16', 'Sunday')).toBe('2026-05-17');
  });

  it('formats a weekend range for the saved page', () => {
    expect(formatWeekendRange('2026-05-10')).toBe('May 10–11, 2026');
    expect(formatWeekendRange('2026-05-31')).toBe('May 31–Jun 1, 2026');
  });

  it('formats a weekend span for the hero', () => {
    expect(formatWeekendSpan('2026-05-16')).toBe('Sat 16 May – Sun 17 May');
  });
});
