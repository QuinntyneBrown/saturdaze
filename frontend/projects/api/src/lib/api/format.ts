/**
 * Presentation formatting shared by pages and services. Kept free of
 * Angular so it can be unit-tested as plain functions.
 */

export const MONTH_ABBR: readonly string[] = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

/**
 * How much of a timestamp to show:
 * - `time` → "Sat 2 PM"
 * - `date` → "Sat, May 16, 2 PM"
 * - `full` → "Sat, May 16, 2026, 2 PM"
 */
export type WhenStyle = 'time' | 'date' | 'full';

/** Format a local date-time string (`YYYY-MM-DDTHH:mm`) for humans. */
export function formatWhen(iso: string, style: WhenStyle = 'time'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    hour: 'numeric',
    minute: d.getMinutes() === 0 ? undefined : '2-digit',
  };
  if (style !== 'time') {
    options.month = 'short';
    options.day = 'numeric';
  }
  if (style === 'full') options.year = 'numeric';
  return d.toLocaleString(undefined, options);
}

/** The `DD` / `MON` pair rendered on event date tiles (local time). */
export function dateTileParts(iso: string): { day: string; mon: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: '', mon: '' };
  return { day: String(d.getDate()), mon: MONTH_ABBR[d.getMonth()]! };
}

/** "just now" / "3 hours ago" / "2 days ago". */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return '';
  const hours = Math.floor(Math.max(0, now - then) / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** Backend `TimeOnly` ("HH:mm:ss") → "H:mm" (no leading zero on the hour). */
export function hhmm(timeOnly: string): string {
  const [h, m] = timeOnly.split(':');
  return `${Number(h)}:${m ?? '00'}`;
}

/** "HH:mm[:ss]" → minutes since midnight. */
export function toMinutes(timeOnly: string): number {
  const [h, m] = timeOnly.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Whole minutes between two `TimeOnly` strings. */
export function minutesBetween(start: string, end: string): number {
  return toMinutes(end) - toMinutes(start);
}

/** 45 → "45m", 90 → "1h 30m", 120 → "2h". */
export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
