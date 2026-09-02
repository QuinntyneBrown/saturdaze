import { BlockKind } from '../models/block-kind';
import { BlockRow } from '../models/block-row';
import { ChipView } from '../models/chip-view';
import { DayView } from '../models/day-view';
import { ItineraryBlockDto } from '../models/itinerary-block.dto';
import { ShoppingErrandDto } from '../models/shopping-errand.dto';
import { WeatherDay } from '../models/weather-day';
import { WeatherForecastDto } from '../models/weather-forecast.dto';
import { WeekendDay } from '../models/weekend-day';
import { WeekendDto } from '../models/weekend.dto';
import { WeekendStatus, WeekendView } from '../models/weekend-view';
import { capitalise, formatDuration, hhmm, minutesBetween, timeRange, toMinutes } from './format';
import { forecastFor, roundOrDash, weatherAdjective, weatherIcon, weatherNote } from './weather';
import { formatDayDate, weekendDayIso } from './weekend-dates';

/**
 * WeekendDto → WeekendView. One pure projection shared by the weekend
 * service and the read-only shared-weekend page, so both render the same
 * `sd-day` / `sd-block` rows.
 */

const HEADLINE_READY = 'This weekend';
const HEADLINE_EMPTY = 'Your first weekend';
const SUBTITLE_LOADING = 'Pulling the latest plan.';
const SUBTITLE_EMPTY = 'Nothing is drafted yet. Planning takes a few seconds.';

/** The planner writes this on every commitment block; it is not copy. */
const PLANNER_COMMITMENT_REASON = 'fixed commitment';

const DAYS: readonly WeekendDay[] = ['Saturday', 'Sunday'];

/**
 * Project a weekend. Without a dto the view is `loading` (or whatever
 * `status` says); with one the status is `ready`, or `empty` when the plan
 * has no blocks. Pass `status` to force it, e.g. `'ready'` for a share link.
 */
export function projectWeekend(dto: WeekendDto | null, status?: WeekendStatus): WeekendView {
  if (!dto) return placeholder(status ?? 'loading');
  const resolved: WeekendStatus = status ?? (dto.blocks.length === 0 ? 'empty' : 'ready');
  const days = DAYS.map((day) => projectDay(dto, day));
  const [sat, sun] = days as [DayView, DayView];
  return {
    status: resolved,
    id: dto.id,
    weekendOf: dto.weekendOf,
    headline: resolved === 'empty' ? HEADLINE_EMPTY : HEADLINE_READY,
    subtitle:
      resolved === 'empty'
        ? SUBTITLE_EMPTY
        : weekendSubtitle(
            forecastFor(dto.weather, sat.dateIso),
            forecastFor(dto.weather, sun.dateIso),
            highlightOf(sat),
            highlightOf(sun),
          ),
    days,
    blockCount: dto.blocks.length,
  };
}

/** One `sd-day` column: header meta, lock state, keeping list and rows. */
export function projectDay(dto: WeekendDto, day: WeekendDay): DayView {
  const dateIso = weekendDayIso(dto.weekendOf, day);
  const dateLabel = formatDayDate(dateIso);
  const forecast = forecastFor(dto.weather, dateIso);
  const sorted = dto.blocks.filter((b) => b.day === day).sort(bySortThenStart);
  const highlightId = sorted.find((b) => b.kind === 'Activity')?.id ?? null;
  const blocks = sorted.map((b, i) =>
    toBlockRow(b, dto.errands, {
      previous: sorted[i - 1] ?? null,
      highlight: b.id === highlightId,
    }),
  );
  const lockable = blocks.filter((b) => b.lockable);
  return {
    day,
    dateIso,
    dateLabel,
    weather: toWeatherDay(day, forecast),
    meta: dayMeta(dateLabel, forecast),
    locked: lockable.length > 0 && lockable.every((b) => b.locked),
    keeping: dayKeeping(sorted),
    blocks,
  };
}

/**
 * One timeline row. `previous` lets a Drive block hand its minutes to the
 * Activity that follows it; `highlight` marks the day's first activity.
 */
export function toBlockRow(
  b: ItineraryBlockDto,
  errands: ReadonlyArray<ShoppingErrandDto>,
  options: { previous?: ItineraryBlockDto | null; highlight?: boolean } = {},
): BlockRow {
  const previous = options.previous ?? null;
  const highlight = options.highlight ?? false;
  const durationMinutes = minutesBetween(b.startTime, b.endTime);
  const commitment = b.kind === 'Commitment';
  const drive = b.kind === 'Drive';
  const errand = b.kind === 'Errand';
  const done = errand ? (errands.find((e) => e.id === b.refId)?.done ?? false) : false;
  const reason = b.reason.trim() ? b.reason : null;
  return {
    id: b.id,
    day: b.day,
    kind: b.kind,
    refId: b.refId,
    time: hhmm(b.startTime),
    timeRange: timeRange(b.startTime, b.endTime),
    duration: formatDuration(durationMinutes),
    durationMinutes,
    icon: blockIcon(b.kind, b.title),
    title: b.title,
    subtitle: blockSubtitle(b, reason),
    reason,
    chips: blockChips(b, { previous, highlight, done }),
    locked: b.isLocked,
    commitment,
    errand,
    done,
    drive,
    highlight,
    swappable: b.kind === 'Activity' && !b.isLocked,
    lockable: !commitment && !drive,
  };
}

/**
 * "Sunny Saturday for the lavender, a cloudy Sunday for the Rec Room." A
 * day without an activity falls back to "a quiet Saturday at home".
 */
export function weekendSubtitle(
  sat: WeatherForecastDto | null,
  sun: WeatherForecastDto | null,
  satHighlight: string | null,
  sunHighlight: string | null,
): string {
  const satAdj = weatherAdjective(sat);
  const sunAdj = weatherAdjective(sun);
  const satPart = satHighlight
    ? `${satAdj ? `${capitalise(satAdj)} ` : ''}Saturday for ${satHighlight}`
    : 'A quiet Saturday at home';
  const sunPart = sunHighlight
    ? `${sunAdj ? `a ${sunAdj} ` : ''}Sunday for ${sunHighlight}`
    : 'a quiet Sunday at home';
  return `${satPart}, ${sunPart}.`;
}

/** The `sd-icon` for a block, by kind with a title heuristic for activities. */
export function blockIcon(kind: BlockKind, title: string): string {
  const t = title.toLowerCase();
  switch (kind) {
    case 'Meal':
      return t.includes('home') ? 'home' : 'fork';
    case 'Downtime':
      return t.includes('home') ? 'home' : 'bed';
    case 'Drive':
      return 'car';
    case 'Commitment':
      return 'lock';
    case 'Errand':
      return 'bag';
    default:
      return activityIcon(t);
  }
}

/** "Swim 9:00" for every block a regenerate keeps: commitments and locks. */
export function dayKeeping(blocks: ReadonlyArray<ItineraryBlockDto>): string[] {
  return blocks
    .filter((b) => b.kind !== 'Drive' && (b.kind === 'Commitment' || b.isLocked))
    .map((b) => `${b.title} ${hhmm(b.startTime)}`);
}

/** Sort by the planner's order, then by start time. */
export function bySortThenStart(a: ItineraryBlockDto, b: ItineraryBlockDto): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return toMinutes(a.startTime) - toMinutes(b.startTime);
}

function placeholder(status: WeekendStatus): WeekendView {
  return {
    status,
    id: null,
    weekendOf: null,
    headline: status === 'empty' ? HEADLINE_EMPTY : HEADLINE_READY,
    subtitle: status === 'empty' ? SUBTITLE_EMPTY : SUBTITLE_LOADING,
    days: [],
    blockCount: 0,
  };
}

function highlightOf(day: DayView): string | null {
  return day.blocks.find((b) => b.highlight)?.title ?? null;
}

function activityIcon(lowerTitle: string): string {
  if (/theatre|theater|concert|show|cirque|symphony|cinema|movie/.test(lowerTitle)) {
    return 'ticket';
  }
  if (/museum|science|rec room|arcade|bowling|indoor|centre|center|library/.test(lowerTitle)) {
    return 'popcorn';
  }
  return 'tree';
}

function blockSubtitle(b: ItineraryBlockDto, reason: string | null): string | null {
  if (b.kind === 'Drive') return null;
  if (b.kind === 'Commitment') {
    const boilerplate = !reason || reason.toLowerCase() === PLANNER_COMMITMENT_REASON;
    return boilerplate ? `Every ${b.day} · locked in` : reason;
  }
  return reason;
}

function blockChips(
  b: ItineraryBlockDto,
  ctx: { previous: ItineraryBlockDto | null; highlight: boolean; done: boolean },
): ChipView[] {
  const chips: ChipView[] = [];
  if (b.kind === 'Commitment') {
    chips.push({ tone: 'accent', icon: 'lock', label: 'Commitment' });
  } else if (b.isLocked) {
    chips.push({ tone: 'accent', icon: 'lock', label: 'Locked' });
  }
  if (ctx.highlight) chips.push({ tone: 'primary', label: 'Day highlight' });
  if (b.kind === 'Activity' && ctx.previous?.kind === 'Drive') {
    const mins = minutesBetween(ctx.previous.startTime, ctx.previous.endTime);
    if (mins > 0) chips.push({ tone: 'sky', icon: 'car', label: `${mins} min drive` });
  }
  if (b.kind === 'Errand') chips.push({ tone: 'indoor', label: 'Errand' });
  if (ctx.done) chips.push({ tone: 'accent', icon: 'check', label: 'Done' });
  return chips;
}

function toWeatherDay(day: WeekendDay, w: WeatherForecastDto | null): WeatherDay {
  return {
    day,
    icon: weatherIcon(w),
    hi: roundOrDash(w?.highCelsius),
    lo: roundOrDash(w?.lowCelsius),
    note: weatherNote(w),
  };
}

/** "17 May · 22° / 14° · Light breeze, good for outdoors". */
function dayMeta(dateLabel: string, w: WeatherForecastDto | null): string {
  const parts = [dateLabel];
  if (w && !w.unavailable && w.highCelsius != null && w.lowCelsius != null) {
    parts.push(`${Math.round(w.highCelsius)}° / ${Math.round(w.lowCelsius)}°`);
  }
  parts.push(weatherNote(w));
  return parts.join(' · ');
}
