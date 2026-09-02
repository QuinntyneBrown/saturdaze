import { WeekendDay } from '../models/weekend-day';

/**
 * Date helpers shared by every service that reasons about "the weekend".
 * All parsing is UTC-based so a `YYYY-MM-DD` string never drifts by a day
 * in the browser's local zone.
 */

/** Parse `YYYY-MM-DD` as a UTC-midnight `Date`. */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
}

/** `Date` → `YYYY-MM-DD` (UTC). */
export function toIsoDate(date: Date): string {
  return date.toISOString().substring(0, 10);
}

/** Shift an ISO date by whole days. */
export function addDaysIso(iso: string, days: number): string {
  const d = parseIsoDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

/** The browser's local calendar date as `YYYY-MM-DD`. */
export function localIsoDate(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * The Saturday the backend treats as "current". Mirrors
 * `GetCurrentWeekendQueryHandler.ResolveUpcomingSaturday`: Saturday is
 * itself, Sunday belongs to the weekend that started yesterday, and every
 * other day rolls forward to the coming Saturday.
 */
export function upcomingSaturdayIso(now: Date = new Date()): string {
  const today = localIsoDate(now);
  const dow = now.getDay(); // 0 = Sunday … 6 = Saturday
  if (dow === 6) return today;
  if (dow === 0) return addDaysIso(today, -1);
  return addDaysIso(today, 6 - dow);
}

/** `[Saturday, Sunday]` as UTC dates for a weekend's Saturday ISO. */
export function weekendDates(saturdayIso: string): [Date, Date] {
  const sat = parseIsoDate(saturdayIso);
  const sun = new Date(sat);
  sun.setUTCDate(sun.getUTCDate() + 1);
  return [sat, sun];
}

/** The ISO date of a given weekend day. */
export function weekendDayIso(saturdayIso: string, day: WeekendDay): string {
  return day === 'Saturday' ? saturdayIso : addDaysIso(saturdayIso, 1);
}

/** "May" / "Sep" — month abbreviation for a UTC date. */
export function monthAbbr(d: Date): string {
  return d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
}

/** "May 10–11, 2026" (or "May 31–Jun 1, 2026" across a month boundary). */
export function formatWeekendRange(saturdayIso: string): string {
  const [sat, sun] = weekendDates(saturdayIso);
  const satMon = monthAbbr(sat);
  const sunMon = monthAbbr(sun);
  const tail = satMon === sunMon
    ? `${sun.getUTCDate()}`
    : `${sunMon} ${sun.getUTCDate()}`;
  return `${satMon} ${sat.getUTCDate()}–${tail}, ${sat.getUTCFullYear()}`;
}

/** "Sat 17 May – Sun 18 May". */
export function formatWeekendSpan(saturdayIso: string): string {
  const [sat, sun] = weekendDates(saturdayIso);
  return `Sat ${sat.getUTCDate()} ${monthAbbr(sat)} – Sun ${sun.getUTCDate()} ${monthAbbr(sun)}`;
}
