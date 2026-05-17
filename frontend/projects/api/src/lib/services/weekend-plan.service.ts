import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { Block } from '../models/block';
import { DayChip } from '../models/day-chip';
import { DayHeaderChip } from '../models/day-header-chip';
import { DayOption } from '../models/day-option';
import { DaySummary } from '../models/day-summary';
import { ItineraryBlockDto } from '../models/itinerary-block.dto';
import { ItineraryView } from '../models/itinerary-view';
import { WeatherDay } from '../models/weather-day';
import { WeatherForecastDto } from '../models/weather-forecast.dto';
import { WeekendDto } from '../models/weekend.dto';
import { WeekendOverview } from '../models/weekend-overview';
import { WeekendStat } from '../models/weekend-stat';
import { CalendarLinks, IWeekendPlanService } from './weekend-plan.service.contract';

interface WeekendShareDto {
  readonly shareUrl: string;
  readonly token: string;
}

const EMPTY_OVERVIEW: WeekendOverview = {
  greeting: 'Loading your weekend…',
  heroSubtitle: 'Pulling the latest plan from the planner.',
  heroCta: 'Plan This Weekend',
  forecastSubtitle: '',
  forecast: [],
  days: [],
  anticipations: [],
  quickActions: defaultQuickActions(0),
  preview: [],
};

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

@Injectable({ providedIn: 'root' })
export class WeekendPlanService implements IWeekendPlanService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _overview = signal<WeekendOverview>(EMPTY_OVERVIEW);
  private readonly _itinerary = signal<ItineraryView>(EMPTY_ITINERARY);
  private readonly _currentId = signal<string | null>(null);
  private readonly _activeDay = signal<'Saturday' | 'Sunday'>('Saturday');

  constructor() {
    void this.loadCurrent();
  }

  getOverview(): Signal<WeekendOverview> {
    return this._overview.asReadonly();
  }

  getItinerary(): Signal<ItineraryView> {
    return this._itinerary.asReadonly();
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

  async regenerateDay(day: 'Saturday' | 'Sunday', id?: string): Promise<void> {
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

  async markFavourite(favourite: boolean, id?: string): Promise<void> {
    const target = this.targetId(id);
    try {
      const dto = await firstValueFrom(
        this.http.put<WeekendDto>(`${this.baseUrl}/api/weekends/${target}/favourite`, {
          favourite,
        }),
      );
      this.apply(dto);
    } catch (err) {
      console.error('WeekendPlanService.markFavourite failed', err);
    }
  }

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

  async lockDay(day: 'Saturday' | 'Sunday', locked: boolean, id?: string): Promise<void> {
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

  async swapBlock(blockId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/api/blocks/${blockId}/swap`, {}),
      );
      await this.loadCurrent();
    } catch (err) {
      console.error('WeekendPlanService.swapBlock failed', err);
    }
  }

  async addErrand(description: string, estimatedMinutes: number, id?: string): Promise<void> {
    const target = this.targetId(id);
    try {
      const dto = await firstValueFrom(
        this.http.post<WeekendDto>(`${this.baseUrl}/api/weekends/${target}/errands`, {
          description,
          estimatedMinutes,
        }),
      );
      this.apply(dto);
    } catch (err) {
      console.error('WeekendPlanService.addErrand failed', err);
      throw err;
    }
  }

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

  setActiveDay(day: 'Saturday' | 'Sunday'): void {
    this._activeDay.set(day);
    const dto = this._lastDto;
    if (dto) this._itinerary.set(projectItinerary(dto, day));
  }

  private _lastDto: WeekendDto | null = null;

  private apply(dto: WeekendDto): void {
    this._lastDto = dto;
    this._currentId.set(dto.id);
    this._overview.set(projectOverview(dto));
    this._itinerary.set(projectItinerary(dto, this._activeDay()));
  }

  private targetId(id?: string): string {
    const target = id ?? this._currentId();
    if (!target) throw new Error('No current weekend is loaded yet.');
    return target;
  }
}

// ---------------------------------------------------------------------------
// Projection: WeekendDto → WeekendOverview (Home page)
// ---------------------------------------------------------------------------

function projectOverview(dto: WeekendDto): WeekendOverview {
  const [satDate, sunDate] = weekendDates(dto.weekendOf);
  const satWeather = forecastFor(dto.weather, satDate);
  const sunWeather = forecastFor(dto.weather, sunDate);

  const satBlocks = dto.blocks.filter((b) => b.day === 'Saturday').sort(bySortThenStart);
  const sunBlocks = dto.blocks.filter((b) => b.day === 'Sunday').sort(bySortThenStart);

  const satHighlight = topHighlight(satBlocks);
  const sunHighlight = topHighlight(sunBlocks);

  const previewBlocks = satBlocks.slice(0, 5).map(toBlock);

  return {
    greeting: 'Morning, Browns 👋',
    heroSubtitle: heroSubtitle(satWeather, sunWeather),
    heroCta: dto.regenerateCount === 0 ? 'Plan This Weekend' : 'Regenerate weekend',
    forecastSubtitle: forecastSubtitle(satDate, sunDate),
    forecast: [
      toWeatherDay('Saturday', satWeather),
      toWeatherDay('Sunday', sunWeather),
    ],
    days: [
      toDaySummary('Saturday', satDate, satWeather, satBlocks, satHighlight),
      toDaySummary('Sunday', sunDate, sunWeather, sunBlocks, sunHighlight),
    ],
    anticipations: [],
    quickActions: defaultQuickActions(lockedCount(dto.blocks)),
    preview: previewBlocks,
  };
}

function toDaySummary(
  day: string,
  date: Date,
  weather: WeatherForecastDto | null,
  blocks: ReadonlyArray<ItineraryBlockDto>,
  highlight: string,
): DaySummary {
  return {
    day,
    date: `${day.slice(0, 3)} ${date.getUTCDate()} ${monthAbbr(date)}`,
    weather: weather
      ? `${roundOrDash(weather.highCelsius)}°  ${weatherWord(weather)}`
      : '— ',
    icon: weatherIcon(weather),
    highlight,
    chips: dayChips(blocks, weather),
  };
}

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
  const driveMins = blocks
    .filter((b) => b.kind === 'Drive')
    .reduce((sum, b) => sum + minutes(b.startTime, b.endTime), 0);
  if (driveMins > 0) {
    chips.push({ tone: 'sky', icon: 'car', label: `${driveMins} min drive` });
  }
  const isOutdoor = weather?.tags.some((t) => t === 'sunny' || t === 'warm' || t === 'mild');
  chips.push({ tone: isOutdoor ? 'leaf' : 'indoor', label: isOutdoor ? 'Outdoor day' : 'Indoor day' });
  return chips;
}

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

function heroSubtitle(sat: WeatherForecastDto | null, sun: WeatherForecastDto | null): string {
  const goodSat = isOutdoorFriendly(sat);
  const goodSun = isOutdoorFriendly(sun);
  if (goodSat && goodSun) return "Sat & Sun are looking warm. I've sketched a weekend you can take as-is.";
  if (goodSat) return "Saturday looks great outside. Sunday's cooler — I've leaned indoors after lunch.";
  if (goodSun) return "Saturday's mixed; Sunday opens up. Outdoor plans lean to Sunday.";
  return "Mixed weather both days. Indoor-friendly plan ready for you.";
}

function forecastSubtitle(sat: Date, sun: Date): string {
  return `Sat ${sat.getUTCDate()} ${monthAbbr(sat)} – Sun ${sun.getUTCDate()} ${monthAbbr(sun)}`;
}

function defaultQuickActions(lockedBlocks: number) {
  return [
    {
      title: 'Regenerate the weekend',
      subtitle: 'Same commitments, fresh ideas',
      icon: 'refresh',
    },
    {
      title: "Lock what's already perfect",
      subtitle: `${lockedBlocks} block${lockedBlocks === 1 ? '' : 's'} locked`,
      icon: 'lock',
    },
    {
      title: 'Share with Sara for approval',
      subtitle: 'A read-only preview link',
      icon: 'share',
    },
  ];
}

// ---------------------------------------------------------------------------
// Projection: WeekendDto → ItineraryView (Itinerary page)
// ---------------------------------------------------------------------------

function projectItinerary(dto: WeekendDto, active: 'Saturday' | 'Sunday'): ItineraryView {
  const [satDate, sunDate] = weekendDates(dto.weekendOf);
  const satBlocks = dto.blocks.filter((b) => b.day === 'Saturday').sort(bySortThenStart);
  const sunBlocks = dto.blocks.filter((b) => b.day === 'Sunday').sort(bySortThenStart);
  const activeBlocks = active === 'Saturday' ? satBlocks : sunBlocks;
  const activeDate = active === 'Saturday' ? satDate : sunDate;
  const activeWeather = forecastFor(dto.weather, activeDate);

  const driveMins = activeBlocks
    .filter((b) => b.kind === 'Drive')
    .reduce((sum, b) => sum + minutes(b.startTime, b.endTime), 0);
  const lockedCount = activeBlocks.filter((b) => b.isLocked).length;

  return {
    day: active,
    eyebrow: `${activeDate.getUTCDate()} ${monthAbbr(activeDate)} ${activeDate.getUTCFullYear()}`,
    title: activeWeather
      ? `${weatherWordCapitalised(activeWeather)} & ${roundOrDash(activeWeather.highCelsius)}°`
      : 'Plan ready',
    subtitle: itinerarySubtitle(activeBlocks),
    icon: weatherIcon(activeWeather),
    chips: itineraryChips(activeBlocks, activeWeather, lockedCount, driveMins),
    dayOptions: [
      dayOption('saturday', 'Saturday', satBlocks, forecastFor(dto.weather, satDate), active === 'Saturday'),
      dayOption('sunday', 'Sunday', sunBlocks, forecastFor(dto.weather, sunDate), active === 'Sunday'),
    ],
    stats: stats(satBlocks.concat(sunBlocks)),
    previewTitle: `${active} — timeline`,
    previewSubtitle: 'Tap any block for why, alternatives, map',
    blocks: activeBlocks.map(toBlock),
  };
}

function itineraryChips(
  blocks: ReadonlyArray<ItineraryBlockDto>,
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

function dayOption(
  key: 'saturday' | 'sunday',
  label: 'Saturday' | 'Sunday',
  blocks: ReadonlyArray<ItineraryBlockDto>,
  weather: WeatherForecastDto | null,
  active: boolean,
): DayOption {
  const highlight = topHighlight(blocks);
  return {
    key,
    label,
    icon: weatherIcon(weather),
    iconTone: weather?.tags.includes('sunny') ? 'sun' : 'soft',
    meta: `${blocks.length} blocks · ${roundOrDash(weather?.highCelsius ?? null)}° ${weatherWord(weather)} · ${highlight} highlight`,
    active,
  };
}

function stats(allBlocks: ReadonlyArray<ItineraryBlockDto>): WeekendStat[] {
  const driveMins = allBlocks
    .filter((b) => b.kind === 'Drive')
    .reduce((sum, b) => sum + minutes(b.startTime, b.endTime), 0);
  const locked = allBlocks.filter((b) => b.isLocked).length;
  return [
    { num: String(allBlocks.length), label: 'blocks planned' },
    { num: formatMinutes(driveMins), label: 'total driving' },
    { num: String(locked), label: 'locked anchors' },
    { num: '$~120', label: 'est. spend' },
  ];
}

function itinerarySubtitle(blocks: ReadonlyArray<ItineraryBlockDto>): string {
  if (blocks.length === 0) return 'Nothing planned yet.';
  const first = blocks[0]!;
  const last = blocks[blocks.length - 1]!;
  return `Out the door by ${hhmm(first.startTime)} — wraps by ${hhmm(last.endTime)}`;
}

// ---------------------------------------------------------------------------
// Block projection
// ---------------------------------------------------------------------------

function toBlock(b: ItineraryBlockDto): Block {
  const dur = minutes(b.startTime, b.endTime);
  return {
    id: b.id,
    day: b.day,
    time: hhmm(b.startTime),
    duration: formatMinutes(dur),
    title: b.title,
    subtitle: b.reason || undefined,
    icon: blockIcon(b.kind),
    tone: blockTone(b.kind),
    locked: b.isLocked || undefined,
    drive: b.kind === 'Drive' ? `${dur} min` : undefined,
  };
}

function blockTone(kind: ItineraryBlockDto['kind']): Block['tone'] {
  switch (kind) {
    case 'Meal': return 'meal';
    case 'Drive': return 'drive';
    case 'Workout': return 'workout';
    case 'Commitment': return 'fixed';
    case 'Downtime': return 'downtime';
    case 'Errand': return 'fixed';
    default: return 'default';
  }
}

function blockIcon(kind: ItineraryBlockDto['kind']): string {
  switch (kind) {
    case 'Meal': return 'fork';
    case 'Drive': return 'car';
    case 'Workout': return 'bike';
    case 'Commitment': return 'lock';
    case 'Downtime': return 'bed';
    case 'Errand': return 'bag';
    default: return 'tree';
  }
}

function topHighlight(blocks: ReadonlyArray<ItineraryBlockDto>): string {
  const top = blocks.find((b) => b.kind === 'Activity');
  return top ? top.title : 'Quiet day at home';
}

function lockedCount(blocks: ReadonlyArray<ItineraryBlockDto>): number {
  return blocks.filter((b) => b.isLocked).length;
}

// ---------------------------------------------------------------------------
// Date / weather helpers
// ---------------------------------------------------------------------------

function weekendDates(saturdayIso: string): [Date, Date] {
  const [y, m, d] = saturdayIso.split('-').map(Number);
  const sat = new Date(Date.UTC(y!, m! - 1, d!));
  const sun = new Date(sat);
  sun.setUTCDate(sun.getUTCDate() + 1);
  return [sat, sun];
}

function forecastFor(weather: ReadonlyArray<WeatherForecastDto>, day: Date): WeatherForecastDto | null {
  const iso = day.toISOString().substring(0, 10);
  return weather.find((w) => w.date === iso) ?? null;
}

function weatherIcon(w: WeatherForecastDto | null): string {
  if (!w || w.unavailable) return 'cloud';
  if (w.tags.includes('rain')) return 'rain';
  if (w.tags.includes('snow')) return 'cloud';
  if (w.tags.includes('sunny')) return 'sun';
  return 'cloud';
}

function weatherWord(w: WeatherForecastDto | null): string {
  if (!w || w.unavailable) return 'forecast pending';
  if (w.tags.includes('rain')) return 'rain';
  if (w.tags.includes('sunny')) return 'sunny';
  if (w.tags.includes('warm')) return 'warm';
  if (w.tags.includes('cold')) return 'cold';
  return 'cloudy';
}

function weatherWordCapitalised(w: WeatherForecastDto | null): string {
  const word = weatherWord(w);
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function weatherNote(w: WeatherForecastDto): string {
  if (w.unavailable) return 'Forecast unavailable.';
  if (w.tags.includes('rain')) return 'Rain expected — plan indoors.';
  if (w.tags.includes('sunny') && w.tags.includes('warm')) return 'Light breeze, perfect for outdoors';
  if (w.tags.includes('sunny')) return 'Sunny — bring layers';
  if (w.tags.includes('cold')) return 'Cold day — indoor-friendly';
  return 'Variable cloud — flex the plan';
}

function isOutdoorFriendly(w: WeatherForecastDto | null): boolean {
  if (!w || w.unavailable) return false;
  if (w.tags.includes('rain') || w.tags.includes('snow') || w.tags.includes('cold')) return false;
  return w.tags.includes('sunny') || w.tags.includes('warm') || w.tags.includes('mild');
}

function roundOrDash(n: number | null): string {
  if (n == null) return '—';
  return String(Math.round(n));
}

// ---------------------------------------------------------------------------
// Time / sort helpers
// ---------------------------------------------------------------------------

function hhmm(timeOnly: string): string {
  // Backend serialises TimeOnly as "HH:mm:ss" — trim to "H:mm" (no leading zero on hour).
  const [h, m] = timeOnly.split(':');
  return `${Number(h)}:${m}`;
}

function minutes(start: string, end: string): number {
  return toMinutes(end) - toMinutes(start);
}

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h! * 60 + (m ?? 0);
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function bySortThenStart(a: ItineraryBlockDto, b: ItineraryBlockDto): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return toMinutes(a.startTime) - toMinutes(b.startTime);
}

function monthAbbr(d: Date): string {
  return d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
}
