/**
 * Weekend date helpers mirroring `weekend-dates.ts` in the api library and
 * `GetCurrentWeekendQueryHandler.ResolveUpcomingSaturday` on the server:
 * Saturday is "today" on a Saturday, "yesterday" on a Sunday, otherwise the
 * next Saturday.
 */

const MONTH_ABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

function localIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return localIso(d);
}

export function upcomingSaturdayIso(now: Date = new Date()): string {
  const today = localIso(now);
  const dow = now.getDay();
  if (dow === 6) return today;
  if (dow === 0) return addDaysIso(today, -1);
  return addDaysIso(today, 6 - dow);
}

/** `{ day: "5", mon: "SEP" }` for the event-card date tile. */
export function dateTile(iso: string): { day: string; mon: string } {
  const d = new Date(`${iso}T12:00:00`);
  return { day: String(d.getDate()), mon: MONTH_ABBR[d.getMonth()]! };
}
