// Traces to: L2-047 #1, #2
import { nextHourFromNow } from './next-hour-default';

describe('nextHourFromNow', () => {
  it('rounds up to the next whole hour (off-the-hour input)', () => {
    // 2026-05-18 11:23 -> 2026-05-18 13:00
    const result = nextHourFromNow(new Date(2026, 4, 18, 11, 23, 0));
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(18);
    expect(result.getHours()).toBe(13);
    expect(result.getMinutes()).toBe(0);
  });

  it('advances even when input is exactly on the hour', () => {
    // 2026-05-18 11:00:00 -> 2026-05-18 12:00
    const result = nextHourFromNow(new Date(2026, 4, 18, 11, 0, 0));
    expect(result.getHours()).toBe(12);
    expect(result.getMinutes()).toBe(0);
  });

  it('wraps across midnight', () => {
    // 2026-05-18 23:30 -> 2026-05-19 01:00
    const result = nextHourFromNow(new Date(2026, 4, 18, 23, 30, 0));
    expect(result.getDate()).toBe(19);
    expect(result.getHours()).toBe(1);
    expect(result.getMinutes()).toBe(0);
  });
});
