import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { formatMinutes, hhmm, minutesBetween, toMinutes } from '../api/format';
import {
  forecastFor,
  isOutdoorFriendly,
  isWetDay,
  roundOrDash,
  weatherIcon,
  weatherNote,
  weatherWord,
  weatherWordCapitalised,
} from '../api/weather';
import { addDaysIso, formatWeekendSpan, monthAbbr, weekendDates } from '../api/weekend-dates';
import { AnticipationTip } from '../models/anticipation-tip';
import { Block } from '../models/block';
import { DayChip } from '../models/day-chip';
import { DayHeaderChip } from '../models/day-header-chip';
import { DayOption } from '../models/day-option';
import { DaySummary } from '../models/day-summary';
import { ErrandPlacement } from '../models/errand-placement';
import { ItineraryBlockDto } from '../models/itinerary-block.dto';
import { ItineraryView } from '../models/itinerary-view';
import { QuickAction } from '../models/quick-action';
import { ShoppingErrandDto } from '../models/shopping-errand.dto';
import { WeatherDay } from '../models/weather-day';
import { WeatherForecastDto } from '../models/weather-forecast.dto';
import { WeekendDay } from '../models/weekend-day';
import { WeekendDto } from '../models/weekend.dto';
import { WeekendOverview } from '../models/weekend-overview';
import { WeekendStat } from '../models/weekend-stat';
import { FAMILY_SERVICE } from './family.service.contract';
import { CalendarLinks, IWeekendPlanService } from './weekend-plan.service.contract';

/**
 * Weekend Share Dto.
 */
interface WeekendShareDto {
  /**
   * Share Url.
   */
  readonly shareUrl: string;
  /**
   * Token.
   */
  readonly token: string;
}

const EMPTY_ITINERARY: ItineraryView = {
  day: 'Saturday',
  eyebrow: '',
  title: 'Loading…',
  subtitle: 'Pulling the latest plan from the planner.',
  icon: 'sun',
  chips: [],
  dayOptions: [],
  stats: [],
  previewTitle: 'Saturday — timeline',
  previewSubtitle: 'Tap any block for why, alternatives, map',
  blocks: [],
};

/**
 * Loading Overview — rendered until the first weekend arrives.
 */
function loadingOverview(familyName: string | null): WeekendOverview {
  return {
    greeting: greetingFor(familyName),
    heroSubtitle: 'Pulling the latest plan from the planner.',
    heroCta: 'Plan This Weekend',
    forecastSubtitle: '',
    forecast: [],
    days: [],
    anticipations: [],
    quickActions: defaultQuickActions(0),
    preview: [],
  };
}

@Injectable({ providedIn: 'root' })
export class WeekendPlanService implements IWeekendPlanService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly family = inject(FAMILY_SERVICE);

  private readonly _dto = signal<WeekendDto | null>(null);
  private readonly _activeDay = signal<WeekendDay>('Saturday');
  private readonly _lastErrandPlacement = signal<ErrandPlacement | null>(null);

  private readonly _overview = computed<WeekendOverview>(() => {
    const dto = this._dto();
    const familyName = this.family.getProfile()().familyName;
    return dto ? projectOverview(dto, familyName) : loadingOverview(familyName);
  });

  private readonly _itinerary = computed<ItineraryView>(() => {
    const dto = this._dto();
    return dto ? projectItinerary(dto, this._activeDay()) : EMPTY_ITINERARY;
  });

  /**
   * Constructor.
   */
  constructor() {
    void this.loadCurrent();
  }

  /**
   * Get Overview.
   *
   * @returns {Signal<WeekendOverview>} The result of the operation
   */
  getOverview(): Signal<WeekendOverview> {
    return this._overview;
  }

  /**
   * Get Itinerary.
   *
   * @returns {Signal<ItineraryView>} The result of the operation
   */
  getItinerary(): Signal<ItineraryView> {
    return this._itinerary;
  }

  /**
   * Last Errand Placement.
   *
   * @returns {Signal<ErrandPlacement | null>} The result of the operation
   */
  lastErrandPlacement(): Signal<ErrandPlacement | null> {
    return this._lastErrandPlacement.asReadonly();
  }

  /** Fetch the upcoming weekend (server auto-plans on miss). */
  async loadCurrent(): Promise<void> {
    try {
      const dto = await firstValueFrom(
        this.http.get<WeekendDto>(`${this.baseUrl}/api/weekends/current`),
      );
      this.apply(dto);
    } catch (err) {
      console.error('WeekendPlanService.loadCurrent failed', err);
    }
  }

  /** Plan an explicit Saturday. POST /api/weekends/plan. Idempotent server-side. */
  async plan(weekendOfIso: string): Promise<void> {
    try {
      const dto = await firstValueFrom(
        this.http.post<WeekendDto>(`${this.baseUrl}/api/weekends/plan`, {
          weekendOf: weekendOfIso,
        }),
      );
      this.apply(dto);
    } catch (err) {
      console.error('WeekendPlanService.plan failed', err);
    }
  }

  /**
   * Regenerate.
   *
   * @returns {Promise<void>} The result of the operation
   */
  async regenerate(id?: string): Promise<void> {
    const target = this.targetId(id);
    try {
      const dto = await firstValueFrom(
        this.http.post<WeekendDto>(`${this.baseUrl}/api/weekends/${target}/regenerate`, {}),
      );
      this.apply(dto);
    } catch (err) {
      console.error('WeekendPlanService.regenerate failed', err);
    }
  }

  /**
   * Regenerate Day.
   *
   * @param {WeekendDay} day - The day
   *
   * @returns {Promise<void>} The result of the operation
   */
  async regenerateDay(day: WeekendDay, id?: string): Promise<void> {
    const target = this.targetId(id);
    try {
      const dto = await firstValueFrom(
        this.http.post<WeekendDto>(
          `${this.baseUrl}/api/weekends/${target}/days/${day.toLowerCase()}/regenerate`,
          {},
        ),
      );
      this.apply(dto);
    } catch (err) {
      console.error('WeekendPlanService.regenerateDay failed', err);
      throw err;
    }
  }

  /**
   * Create Share Link.
   *
   * @returns {Promise<string>} The result of the operation
   */
  async createShareLink(id?: string): Promise<string> {
    const target = this.targetId(id);
    try {
      const dto = await firstValueFrom(
        this.http.post<WeekendShareDto>(`${this.baseUrl}/api/weekends/${target}/share`, {}),
      );
      return dto.shareUrl;
    } catch (err) {
      console.error('WeekendPlanService.createShareLink failed', err);
      throw err;
    }
  }

  /**
   * Calendar Links.
   *
   * @returns {CalendarLinks} The result of the operation
   */
  calendarLinks(id?: string): CalendarLinks {
    const target = this.targetId(id);
    const icsUrl = `${this.baseUrl}/api/weekends/${target}/calendar.ics`;
    const webcalUrl = icsUrl.replace(/^https?:/i, 'webcal:');
    return {
      icsUrl,
      webcalUrl,
      googleCalendarUrl: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`,
    };
  }

  /**
   * Lock Block.
   *
   * @param {string} blockId - The block id
   * @param {boolean} locked - The locked
   *
   * @returns {Promise<void>} The result of the operation
   */
  async lockBlock(blockId: string, locked: boolean): Promise<void> {
    try {
      const dto = await firstValueFrom(
        this.http.put<WeekendDto>(`${this.baseUrl}/api/blocks/${blockId}/lock`, { locked }),
      );
      this.apply(dto);
    } catch (err) {
      console.error('WeekendPlanService.lockBlock failed', err);
      throw err;
    }
  }

  /**
   * Swap Block.
   *
   * @param {string} blockId - The block id
   * @param {readonly string[]} rejectedActivityIds - Activities to exclude
   *
   * @returns {Promise<void>} The result of the operation
   */
  async swapBlock(blockId: string, rejectedActivityIds: readonly string[] = []): Promise<void> {
    try {
      const dto = await firstValueFrom(
        this.http.post<WeekendDto>(`${this.baseUrl}/api/blocks/${blockId}/swap`, {
          rejectedActivityIds: [...rejectedActivityIds],
        }),
      );
      this.apply(dto);
    } catch (err) {
      console.error('WeekendPlanService.swapBlock failed', err);
      throw err;
    }
  }

  /**
   * Lock Day.
   *
   * @param {WeekendDay} day - The day
   * @param {boolean} locked - The locked
   *
   * @returns {Promise<void>} The result of the operation
   */
  async lockDay(day: WeekendDay, locked: boolean, id?: string): Promise<void> {
    const target = this.targetId(id);
    try {
      const dto = await firstValueFrom(
        this.http.put<WeekendDto>(
          `${this.baseUrl}/api/weekends/${target}/days/${day.toLowerCase()}/lock`,
          { locked },
        ),
      );
      this.apply(dto);
    } catch (err) {
      console.error('WeekendPlanService.lockDay failed', err);
      throw err;
    }
  }

  /**
   * Add Errand.
   *
   * @param {string} description - The description
   * @param {number} estimatedMinutes - The estimated minutes
   * @param {WeekendDay | null} preferredDay - The preferred day
   *
   * @returns {Promise<void>} The result of the operation
   */
  async addErrand(
    description: string,
    estimatedMinutes: number,
    preferredDay: WeekendDay | null = null,
    id?: string,
  ): Promise<void> {
    const target = this.targetId(id);
    try {
      const dto = await firstValueFrom(
        this.http.post<WeekendDto>(`${this.baseUrl}/api/weekends/${target}/errands`, {
          description,
          estimatedMinutes,
          preferredDay,
        }),
      );
      this.apply(dto);
      if (dto) this._lastErrandPlacement.set(placementFor(dto, description));
    } catch (err) {
      console.error('WeekendPlanService.addErrand failed', err);
      throw err;
    }
  }

  /**
   * Set Errand Done.
   *
   * @param {string} errandId - The errand id
   * @param {boolean} done - The done flag
   *
   * @returns {Promise<void>} The result of the operation
   */
  async setErrandDone(errandId: string, done: boolean): Promise<void> {
    try {
      const dto = await firstValueFrom(
        this.http.put<WeekendDto>(`${this.baseUrl}/api/errands/${errandId}/done`, { done }),
      );
      this.apply(dto);
    } catch (err) {
      console.error('WeekendPlanService.setErrandDone failed', err);
      throw err;
    }
  }

  /**
   * Remix Saved.
   *
   * @param {string} id - The id
   *
   * @returns {Promise<void>} The result of the operation
   */
  async remixSaved(id: string): Promise<void> {
    try {
      const dto = await firstValueFrom(
        this.http.post<WeekendDto>(`${this.baseUrl}/api/weekends/${id}/remix`, {}),
      );
      this.apply(dto);
    } catch (err) {
      console.error('WeekendPlanService.remixSaved failed', err);
      throw err;
    }
  }

  /**
   * Repeat Saved.
   *
   * @param {string} id - The id
   *
   * @returns {Promise<void>} The result of the operation
   */
  async repeatSaved(id: string): Promise<void> {
    try {
      const dto = await firstValueFrom(
        this.http.post<WeekendDto>(`${this.baseUrl}/api/weekends/${id}/repeat`, {}),
      );
      this.apply(dto);
    } catch (err) {
      console.error('WeekendPlanService.repeatSaved failed', err);
      throw err;
    }
  }

  /**
   * Set Active Day.
   *
   * @param {WeekendDay} day - The day
   *
   * @returns {void} No return value
   */
  setActiveDay(day: WeekendDay): void {
    this._activeDay.set(day);
  }

  /**
   * Apply.
   */
  private apply(dto: WeekendDto | null): void {
    this._dto.set(dto ?? null);
  }

  /**
   * Target Id.
   */
  private targetId(id?: string): string {
    const target = id ?? this._dto()?.id;
    if (!target) throw new Error('No current weekend is loaded yet.');
    return target;
  }
}

// ---------------------------------------------------------------------------
// Projection: WeekendDto → WeekendOverview (Home page)
// ---------------------------------------------------------------------------

/**
 * "Morning, Browns 👋" — the family name without its leading "The".
 */
export function greetingFor(familyName: string | null): string {
  const short = (familyName ?? '').replace(/^the\s+/i, '').trim();
  return short ? `Morning, ${short} 👋` : 'Morning 👋';
}

function projectOverview(dto: WeekendDto, familyName: string | null): WeekendOverview {
  const [satDate, sunDate] = weekendDates(dto.weekendOf);
  const sunIso = addDaysIso(dto.weekendOf, 1);
  const satWeather = forecastFor(dto.weather, dto.weekendOf);
  const sunWeather = forecastFor(dto.weather, sunIso);

  const satBlocks = dto.blocks.filter((b) => b.day === 'Saturday').sort(bySortThenStart);
  const sunBlocks = dto.blocks.filter((b) => b.day === 'Sunday').sort(bySortThenStart);

  return {
    greeting: greetingFor(familyName),
    heroSubtitle: heroSubtitle(satWeather, sunWeather),
    heroCta: dto.regenerateCount === 0 ? 'Plan This Weekend' : 'Regenerate weekend',
    forecastSubtitle: formatWeekendSpan(dto.weekendOf),
    forecast: [
      toWeatherDay('Saturday', satWeather),
      toWeatherDay('Sunday', sunWeather),
    ],
    days: [
      toDaySummary('Saturday', satDate, satWeather, satBlocks),
      toDaySummary('Sunday', sunDate, sunWeather, sunBlocks),
    ],
    anticipations: anticipations(dto, satWeather, sunWeather),
    quickActions: defaultQuickActions(lockedCount(dto.blocks)),
    preview: satBlocks.slice(0, 5).map((b) => toBlock(b, dto.errands)),
  };
}

/**
 * To Day Summary.
 */
function toDaySummary(
  day: WeekendDay,
  date: Date,
  weather: WeatherForecastDto | null,
  blocks: ReadonlyArray<ItineraryBlockDto>,
): DaySummary {
  return {
    day,
    date: `${day.slice(0, 3)} ${date.getUTCDate()} ${monthAbbr(date)}`,
    weather: weather
      ? `${roundOrDash(weather.highCelsius)}°  ${weatherWord(weather)}`
      : '— ',
    icon: weatherIcon(weather),
    highlight: topHighlight(blocks),
    chips: dayChips(blocks, weather),
  };
}

/**
 * Day Chips.
 */
function dayChips(
  blocks: ReadonlyArray<ItineraryBlockDto>,
  weather: WeatherForecastDto | null,
): DayChip[] {
  const chips: DayChip[] = [];
  const firstLocked = blocks.find((b) => b.isLocked);
  if (firstLocked) {
    chips.push({
      tone: 'accent',
      icon: 'lock',
      label: `${hhmm(firstLocked.startTime)} ${firstLocked.title.toLowerCase()}`,
    });
  }
  const driveMins = driveMinutes(blocks);
  if (driveMins > 0) {
    chips.push({ tone: 'sky', icon: 'car', label: `${driveMins} min drive` });
  }
  const isOutdoor = isOutdoorFriendly(weather);
  chips.push({ tone: isOutdoor ? 'leaf' : 'indoor', label: isOutdoor ? 'Outdoor day' : 'Indoor day' });
  return chips;
}

/**
 * To Weather Day.
 */
function toWeatherDay(day: string, w: WeatherForecastDto | null): WeatherDay {
  if (!w) return { day, icon: 'cloud', hi: '—', lo: '—', note: 'Forecast unavailable.' };
  return {
    day,
    icon: weatherIcon(w),
    hi: roundOrDash(w.highCelsius),
    lo: roundOrDash(w.lowCelsius),
    note: weatherNote(w),
  };
}

/**
 * Hero Subtitle.
 */
function heroSubtitle(sat: WeatherForecastDto | null, sun: WeatherForecastDto | null): string {
  const goodSat = isOutdoorFriendly(sat);
  const goodSun = isOutdoorFriendly(sun);
  if (goodSat && goodSun) return "Sat & Sun are looking warm. I've sketched a weekend you can take as-is.";
  if (goodSat) return "Saturday looks great outside. Sunday's cooler — I've leaned indoors after lunch.";
  if (goodSun) return "Saturday's mixed; Sunday opens up. Outdoor plans lean to Sunday.";
  return 'Mixed weather both days. Indoor-friendly plan ready for you.';
}

/**
 * Anticipations — the "11-star" heads-up strip, derived only from data the
 * planner actually has: a wet day, the state of the shopping list, and the
 * first fixed commitment.
 */
function anticipations(
  dto: WeekendDto,
  satWeather: WeatherForecastDto | null,
  sunWeather: WeatherForecastDto | null,
): AnticipationTip[] {
  const tips: AnticipationTip[] = [];

  const wet: Array<[WeekendDay, WeatherForecastDto | null]> = [
    ['Saturday', satWeather],
    ['Sunday', sunWeather],
  ];
  const wetDay = wet.find(([, w]) => isWetDay(w));
  if (wetDay) {
    const [day, w] = wetDay;
    tips.push({
      icon: weatherIcon(w),
      headline: `${day} looks ${weatherWord(w) === 'snow' ? 'snowy' : 'wet'}`,
      body: `I've leaned indoors for ${day}. The indoor picks are lined up if you want more options.`,
      cta: 'See indoor picks',
      href: '/activities',
    });
  }

  const pending = dto.errands.find((e) => !e.done);
  if (pending) {
    const block = dto.blocks.find((b) => b.kind === 'Errand' && b.refId === pending.id);
    tips.push({
      icon: 'bag',
      headline: `${pending.description} is on the list`,
      body: block
        ? `Slotted for ${block.day} at ${hhmm(block.startTime)} — tap the block to mark it done.`
        : 'Not placed yet — regenerate to slot it in.',
      cta: 'Open the day',
      href: `/itinerary?day=${(block?.day ?? 'Saturday').toLowerCase()}`,
    });
  } else {
    tips.push({
      icon: 'bag',
      headline: 'Anything to pick up?',
      body: "Add a shopping run and I'll tuck it next to something you're already doing.",
      cta: 'Add an errand',
      href: '/errand',
    });
  }

  const commitment = [...dto.blocks]
    .sort((a, b) => dayRank(a.day) - dayRank(b.day) || bySortThenStart(a, b))
    .find((b) => b.kind === 'Commitment');
  if (commitment) {
    tips.push({
      icon: 'lock',
      headline: `${commitment.title} · ${commitment.day} ${hhmm(commitment.startTime)}`,
      body: 'Locked in — the rest of the day is built around it.',
    });
  }

  return tips;
}

function dayRank(day: WeekendDay): number {
  return day === 'Saturday' ? 0 : 1;
}

/**
 * Default Quick Actions.
 */
function defaultQuickActions(lockedBlocks: number): QuickAction[] {
  return [
    {
      kind: 'regenerate',
      title: 'Regenerate the weekend',
      subtitle: 'Same commitments, fresh ideas',
      icon: 'refresh',
    },
    {
      kind: 'lock',
      title: "Lock what's already perfect",
      subtitle: `${lockedBlocks} block${lockedBlocks === 1 ? '' : 's'} locked`,
      icon: 'lock',
    },
    {
      kind: 'share',
      title: 'Share this weekend',
      subtitle: 'A read-only preview link',
      icon: 'share',
    },
  ];
}

// ---------------------------------------------------------------------------
// Projection: WeekendDto → ItineraryView (Itinerary page)
// ---------------------------------------------------------------------------

function projectItinerary(dto: WeekendDto, active: WeekendDay): ItineraryView {
  const [satDate, sunDate] = weekendDates(dto.weekendOf);
  const sunIso = addDaysIso(dto.weekendOf, 1);
  const satBlocks = dto.blocks.filter((b) => b.day === 'Saturday').sort(bySortThenStart);
  const sunBlocks = dto.blocks.filter((b) => b.day === 'Sunday').sort(bySortThenStart);
  const activeBlocks = active === 'Saturday' ? satBlocks : sunBlocks;
  const activeDate = active === 'Saturday' ? satDate : sunDate;
  const activeWeather = forecastFor(dto.weather, active === 'Saturday' ? dto.weekendOf : sunIso);

  const driveMins = driveMinutes(activeBlocks);
  const locked = activeBlocks.filter((b) => b.isLocked).length;

  return {
    day: active,
    eyebrow: `${activeDate.getUTCDate()} ${monthAbbr(activeDate)} ${activeDate.getUTCFullYear()}`,
    title: activeWeather
      ? `${weatherWordCapitalised(activeWeather)} & ${roundOrDash(activeWeather.highCelsius)}°`
      : 'Plan ready',
    subtitle: itinerarySubtitle(activeBlocks),
    icon: weatherIcon(activeWeather),
    chips: itineraryChips(activeWeather, locked, driveMins),
    dayOptions: [
      dayOption('saturday', 'Saturday', satBlocks, forecastFor(dto.weather, dto.weekendOf), active === 'Saturday'),
      dayOption('sunday', 'Sunday', sunBlocks, forecastFor(dto.weather, sunIso), active === 'Sunday'),
    ],
    stats: stats(satBlocks.concat(sunBlocks), dto.errands),
    previewTitle: `${active} — timeline`,
    previewSubtitle: 'Tap any block for why, alternatives, map',
    blocks: activeBlocks.map((b) => toBlock(b, dto.errands)),
  };
}

/**
 * Itinerary Chips.
 */
function itineraryChips(
  weather: WeatherForecastDto | null,
  locked: number,
  driveMins: number,
): DayHeaderChip[] {
  const chips: DayHeaderChip[] = [];
  if (locked > 0) chips.push({ tone: 'accent', icon: 'lock', label: `${locked} locked` });
  if (driveMins > 0) chips.push({ tone: 'sky', icon: 'car', label: `${formatMinutes(driveMins)} driving` });
  const outdoor = isOutdoorFriendly(weather);
  chips.push({ tone: outdoor ? 'leaf' : 'indoor', label: outdoor ? 'Outdoor' : 'Indoor' });
  if (weather?.highCelsius != null)
    chips.push({ tone: weather.tags.includes('sunny') ? 'sun' : 'sky', label: `${Math.round(weather.highCelsius)}° hi` });
  return chips;
}

/**
 * Day Option.
 */
function dayOption(
  key: 'saturday' | 'sunday',
  label: WeekendDay,
  blocks: ReadonlyArray<ItineraryBlockDto>,
  weather: WeatherForecastDto | null,
  active: boolean,
): DayOption {
  return {
    key,
    label,
    icon: weatherIcon(weather),
    iconTone: weather?.tags.includes('sunny') ? 'sun' : 'soft',
    meta: `${blocks.length} blocks · ${roundOrDash(weather?.highCelsius)}° ${weatherWord(weather)} · ${topHighlight(blocks)} highlight`,
    active,
  };
}

/**
 * Stats.
 */
function stats(
  allBlocks: ReadonlyArray<ItineraryBlockDto>,
  errands: ReadonlyArray<ShoppingErrandDto>,
): WeekendStat[] {
  const locked = allBlocks.filter((b) => b.isLocked).length;
  const openErrands = errands.filter((e) => !e.done).length;
  return [
    { num: String(allBlocks.length), label: 'blocks planned' },
    { num: formatMinutes(driveMinutes(allBlocks)), label: 'total driving' },
    { num: String(locked), label: 'locked anchors' },
    { num: String(openErrands), label: openErrands === 1 ? 'errand to run' : 'errands to run' },
  ];
}

/**
 * Itinerary Subtitle.
 */
function itinerarySubtitle(blocks: ReadonlyArray<ItineraryBlockDto>): string {
  if (blocks.length === 0) return 'Nothing planned yet.';
  const first = blocks[0]!;
  const last = blocks[blocks.length - 1]!;
  return `Out the door by ${hhmm(first.startTime)} — wraps by ${hhmm(last.endTime)}`;
}

// ---------------------------------------------------------------------------
// Block projection
// ---------------------------------------------------------------------------

function toBlock(b: ItineraryBlockDto, errands: ReadonlyArray<ShoppingErrandDto>): Block {
  const dur = minutesBetween(b.startTime, b.endTime);
  const errand = b.kind === 'Errand' ? errands.find((e) => e.id === b.refId) : undefined;
  return {
    id: b.id,
    day: b.day,
    kind: b.kind,
    refId: b.refId,
    time: hhmm(b.startTime),
    duration: formatMinutes(dur),
    title: b.title,
    subtitle: b.reason || undefined,
    reason: b.reason || undefined,
    icon: blockIcon(b.kind),
    tone: blockTone(b.kind),
    locked: b.isLocked || undefined,
    done: errand?.done,
    drive: b.kind === 'Drive' ? `${dur} min` : undefined,
  };
}

/**
 * Block Tone.
 */
function blockTone(kind: ItineraryBlockDto['kind']): Block['tone'] {
  switch (kind) {
    case 'Meal': return 'meal';
    case 'Drive': return 'drive';
    case 'Commitment': return 'fixed';
    case 'Downtime': return 'downtime';
    case 'Errand': return 'fixed';
    default: return 'default';
  }
}

/**
 * Block Icon.
 */
function blockIcon(kind: ItineraryBlockDto['kind']): string {
  switch (kind) {
    case 'Meal': return 'fork';
    case 'Drive': return 'car';
    case 'Commitment': return 'lock';
    case 'Downtime': return 'bed';
    case 'Errand': return 'bag';
    default: return 'tree';
  }
}

/**
 * Top Highlight.
 */
function topHighlight(blocks: ReadonlyArray<ItineraryBlockDto>): string {
  const top = blocks.find((b) => b.kind === 'Activity');
  return top ? top.title : 'Quiet day at home';
}

/**
 * Locked Count.
 */
function lockedCount(blocks: ReadonlyArray<ItineraryBlockDto>): number {
  return blocks.filter((b) => b.isLocked).length;
}

/**
 * Drive Minutes — the sum of every Drive block on the list.
 */
function driveMinutes(blocks: ReadonlyArray<ItineraryBlockDto>): number {
  return blocks
    .filter((b) => b.kind === 'Drive')
    .reduce((sum, b) => sum + minutesBetween(b.startTime, b.endTime), 0);
}

/**
 * Placement For — where the errand just added landed.
 */
function placementFor(dto: WeekendDto, description: string): ErrandPlacement | null {
  const errand = [...dto.errands].reverse().find((e) => e.description === description)
    ?? dto.errands[dto.errands.length - 1];
  const block = errand
    ? dto.blocks.find((b) => b.kind === 'Errand' && b.refId === errand.id)
    : undefined;
  if (!block) return null;
  return { description, day: block.day, time: hhmm(block.startTime) };
}

/**
 * By Sort Then Start.
 */
function bySortThenStart(a: ItineraryBlockDto, b: ItineraryBlockDto): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return toMinutes(a.startTime) - toMinutes(b.startTime);
}
