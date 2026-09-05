/**
 * Presentation formatting shared by pages and services. Kept free of
 * Angular so it can be unit-tested as plain functions.
 */

export const MONTH_ABBR: readonly string[] = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

const NUMBER_WORDS: readonly string[] = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
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

/** Backend `TimeOnly` ("HH:mm:ss") → "H:mm" (24-hour, no leading zero). */
export function hhmm(timeOnly: string): string {
  const [h, m] = timeOnly.split(':');
  return `${Number(h)}:${m ?? '00'}`;
}

/** "HH:mm[:ss]" → "5:00" on a 12-hour clock, without a suffix. */
export function hhmm12(timeOnly: string): string {
  const [h, m] = timeOnly.split(':');
  const hour = Number(h) % 12 || 12;
  return `${hour}:${m ?? '00'}`;
}

/** "HH:mm[:ss]" → "5:00pm" / "9:15am". */
export function clock12(timeOnly: string): string {
  return `${hhmm12(timeOnly)}${toMinutes(timeOnly) >= 12 * 60 ? 'pm' : 'am'}`;
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

/**
 * A 12-hour range. The suffix is written once, and only when it is needed:
 * "9:00 to 10:00" before noon, "5:00 to 6:00pm" after it, and
 * "10:00am to 2:00pm" when the range crosses noon.
 */
export function timeRange(start: string, end: string): string {
  const startPm = toMinutes(start) >= 12 * 60;
  const endPm = toMinutes(end) >= 12 * 60;
  if (startPm) return `${hhmm12(start)} to ${hhmm12(end)}pm`;
  if (endPm) return `${hhmm12(start)}am to ${hhmm12(end)}pm`;
  return `${hhmm12(start)} to ${hhmm12(end)}`;
}

/** 45 → "45m", 90 → "1h 30m", 120 → "2h". */
export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Block durations as the timeline rail shows them: minutes up to and
 * including 90 stay in minutes ("60m", "90m"); longer spans switch to hours
 * ("2h", "2h 30m").
 */
export function formatDuration(mins: number): string {
  if (mins <= 90) return `${mins}m`;
  return formatMinutes(mins);
}

/** 0..12 → "zero".."twelve"; larger numbers stay as digits. */
export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

/** "twelve" → "Twelve". */
export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "Quinn" → "Q"; blank input → "". */
export function initialOf(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '';
}
