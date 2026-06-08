/**
 * Returns now + 1 hour, ceiling to the next whole hour if there are any
 * stray minutes or seconds — i.e. the soonest hour boundary that is at
 * least one hour in the future.
 *
 * Traces to: L2-047 #1, #2.
 */
export function nextHourFromNow(now: Date): Date {
  const result = new Date(now);
  result.setMilliseconds(0);
  const hasSubHour = result.getMinutes() !== 0 || result.getSeconds() !== 0;
  result.setMinutes(0, 0, 0);
  result.setHours(result.getHours() + (hasSubHour ? 2 : 1));
  return result;
}

/**
 * Same value formatted as the `YYYY-MM-DDTHH:mm` string expected by an
 * <input type="datetime-local">.
 */
export function nextHourFromNowAsInputValue(now: Date): string {
  const d = nextHourFromNow(now);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
