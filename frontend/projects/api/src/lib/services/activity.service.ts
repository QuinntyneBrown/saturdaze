import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { kidsPhrase } from '../api/family-presentation';
import { capitalise } from '../api/format';
import { forecastFor, isOutdoorFriendly, weatherAdjective } from '../api/weather';
import { addDaysIso, upcomingSaturdayIso } from '../api/weekend-dates';
import { ActivityCard, ActivityTone } from '../models/activity-card';
import { ActivityDto } from '../models/activity.dto';
import { ActivitySection } from '../models/activity-section';
import { ChipView } from '../models/chip-view';
import { FilterChip } from '../models/filter-chip';
import { FilterDef } from '../models/filter-def';
import { IdeasActivitiesView } from '../models/ideas-activities-view';
import { WeatherForecastDto } from '../models/weather-forecast.dto';
import { IActivityService } from './activity.service.contract';
import { FAMILY_SERVICE } from './family.service.contract';

const ALL = 'All';

const WEATHER_SAFE_TAGS: readonly string[] = ['rain', 'cold', 'snow'];

const FILTER_DEFS: ReadonlyArray<FilterDef> = [
  { label: ALL, tone: 'default' },
  { label: 'Outdoor', tone: 'leaf', match: (a) => !a.indoor },
  { label: 'Indoor', tone: 'indoor', match: (a) => a.indoor },
  { label: 'Under 30 min', tone: 'default', match: (a) => a.driveMinutes < 30 },
  { label: 'Ages 5+', tone: 'default', match: (a) => a.minAge <= 5 },
  {
    label: 'Weather-safe',
    tone: 'sky',
    match: (a) => a.indoor || a.weatherTags.some((t) => WEATHER_SAFE_TAGS.includes(t)),
  },
];

const SECTION_LIMIT = 3;
const DRIVE_ROUNDING = 15;

const TITLE_WEATHER_FIT = "Right for this weekend's weather";
const TITLE_IF_TURNS = 'If the weather turns';
const TITLE_TRY_NEW = 'Try something new';
const SUBTITLE_TRY_NEW = 'You have not done these recently';

/**
 * Icon For — a disc glyph from the catalogue category.
 */
function iconFor(dto: ActivityDto): string {
  const c = dto.category.toLowerCase();
  if (c.includes('theatre')) return 'ticket';
  if (c.includes('indoor') || c.includes('museum')) return 'popcorn';
  return 'tree';
}

/**
 * Tone For.
 */
function toneFor(dto: ActivityDto): ActivityTone {
  return dto.indoor ? 'indoor' : 'outdoor';
}

/**
 * Ages Chip — "All ages" when toddlers are welcome, else "Ages 5+".
 */
function agesChip(dto: ActivityDto): ChipView {
  return { tone: 'default', label: dto.minAge <= 2 ? 'All ages' : `Ages ${dto.minAge}+` };
}

/**
 * To Card.
 */
function toCard(dto: ActivityDto, firstTime = false): ActivityCard {
  const chips: ChipView[] = [
    { tone: 'sky', icon: 'car', label: `${dto.driveMinutes} min` },
    agesChip(dto),
  ];
  if (firstTime) chips.push({ tone: 'primary', label: 'First time' });
  return {
    id: dto.id,
    title: dto.name,
    meta: dto.category,
    why: dto.description,
    icon: iconFor(dto),
    tone: toneFor(dto),
    chips,
    mapUrl: dto.mapUrl || null,
  };
}

/** True when the activity's own weather tags fit the forecast. */
function fitsForecast(a: ActivityDto, forecast: WeatherForecastDto | null): boolean {
  if (!forecast || forecast.unavailable || a.weatherTags.length === 0) return true;
  return a.weatherTags.some((t) => forecast.tags.includes(t));
}

/** "Sunny Saturday, 22°" — or `null` without a forecast. */
function daySubtitle(day: 'Saturday' | 'Sunday', w: WeatherForecastDto | null): string | null {
  const adj = weatherAdjective(w);
  if (!adj) return null;
  const hi = w?.highCelsius;
  return hi == null ? `${capitalise(adj)} ${day}` : `${capitalise(adj)} ${day}, ${Math.round(hi)}°`;
}

/**
 * Group the catalogue into the three sections:
 *   - weather-fit: outdoor picks when Saturday allows, indoor otherwise
 *   - if the weather turns: the opposite set
 *   - try something new: the server's `tryNew` picks
 */
function buildSections(
  rows: ReadonlyArray<ActivityDto>,
  tryNew: ReadonlyArray<ActivityDto>,
  saturday: WeatherForecastDto | null,
  sunday: WeatherForecastDto | null,
): ActivitySection[] {
  const outdoorDay = isOutdoorFriendly(saturday);
  const used = new Set<string>();
  const take = (pool: ReadonlyArray<ActivityDto>): ActivityDto[] => {
    const picked = pool.filter((a) => !used.has(a.id)).slice(0, SECTION_LIMIT);
    picked.forEach((a) => used.add(a.id));
    return picked;
  };

  const outdoor = rows.filter((a) => !a.indoor && fitsForecast(a, saturday));
  const indoor = rows.filter((a) => a.indoor);
  const weatherFit = take(outdoorDay ? outdoor : indoor);
  const ifTurns = take(outdoorDay ? indoor : rows.filter((a) => !a.indoor));
  const fresh = take(tryNew);

  return [
    {
      title: TITLE_WEATHER_FIT,
      subtitle: daySubtitle('Saturday', saturday),
      activities: weatherFit.map((a) => toCard(a)),
    },
    {
      title: TITLE_IF_TURNS,
      subtitle: daySubtitle('Sunday', sunday),
      activities: ifTurns.map((a) => toCard(a)),
    },
    {
      title: TITLE_TRY_NEW,
      subtitle: SUBTITLE_TRY_NEW,
      activities: fresh.map((a) => toCard(a, true)),
    },
  ];
}

/**
 * "Picked for Eli and Mae, under 45 minutes from Port Credit."
 */
function subtitleFor(kids: string, home: string, maxDrive: number | null): string {
  const who = kids || 'your family';
  const tail = home && maxDrive ? `, under ${maxDrive} minutes from ${home}` : '';
  return `Picked for ${who}${tail}.`;
}

/** The longest drive in the catalogue, rounded up to the next 15 minutes. */
function driveCeiling(rows: ReadonlyArray<ActivityDto>): number | null {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((a) => a.driveMinutes));
  return Math.max(DRIVE_ROUNDING, Math.ceil(max / DRIVE_ROUNDING) * DRIVE_ROUNDING);
}

@Injectable({ providedIn: 'root' })
export class ActivityService implements IActivityService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly family = inject(FAMILY_SERVICE);

  private readonly _rows = signal<ReadonlyArray<ActivityDto>>([]);
  private readonly _tryNew = signal<ReadonlyArray<ActivityDto>>([]);
  private readonly _weather = signal<ReadonlyArray<WeatherForecastDto>>([]);
  private readonly _weekendOf = signal<string>(upcomingSaturdayIso());
  private readonly _filter = signal<string>(ALL);

  private readonly _view = computed<IdeasActivitiesView>(() => {
    const rows = this._rows();
    const filter = this._filter();
    const match = FILTER_DEFS.find((f) => f.label === filter)?.match;
    const weekendOf = this._weekendOf();
    const saturday = forecastFor(this._weather(), weekendOf);
    const sunday = forecastFor(this._weather(), addDaysIso(weekendOf, 1));

    const sections = buildSections(
      match ? rows.filter(match) : rows,
      match ? this._tryNew().filter(match) : this._tryNew(),
      saturday,
      sunday,
    ).filter((s) => !match || s.activities.length > 0);

    const filters: FilterChip[] = FILTER_DEFS.map((f) => ({
      label: f.label,
      tone: f.tone,
      active: f.label === filter,
    }));

    const profile = this.family.getEditableProfile()();
    const subtitle = subtitleFor(
      kidsPhrase(profile?.members ?? []),
      profile?.homeLocation ?? '',
      driveCeiling(rows),
    );

    return { subtitle, filters, sections };
  });

  /**
   * Constructor.
   */
  constructor() {
    void this.load();
  }

  /**
   * List.
   *
   * @returns {Signal<IdeasActivitiesView>} The result of the operation
   */
  list(): Signal<IdeasActivitiesView> {
    return this._view;
  }

  /**
   * Set Filter.
   *
   * @param {string} label - The chip label
   */
  setFilter(label: string): void {
    this._filter.set(FILTER_DEFS.some((f) => f.label === label) ? label : ALL);
  }

  /**
   * Load — the catalogue, the "try new" picks, and the weekend forecast.
   * A missing forecast degrades to an indoor-first grouping.
   *
   * @returns {Promise<void>} The result of the operation
   */
  async load(): Promise<void> {
    const weekendOf = upcomingSaturdayIso();
    try {
      const [rows, tryNew, weather] = await Promise.all([
        firstValueFrom(this.http.get<ActivityDto[]>(`${this.baseUrl}/api/activities`)),
        firstValueFrom(
          this.http.get<ActivityDto[]>(`${this.baseUrl}/api/activities?tryNew=true`),
        ).catch(() => [] as ActivityDto[]),
        firstValueFrom(
          this.http.get<WeatherForecastDto[]>(`${this.baseUrl}/api/weather?weekendOf=${weekendOf}`),
        ).catch(() => [] as WeatherForecastDto[]),
      ]);
      this._weekendOf.set(weekendOf);
      this._rows.set(rows ?? []);
      this._tryNew.set(tryNew ?? []);
      this._weather.set(weather ?? []);
    } catch (err) {
      console.error('ActivityService.load failed', err);
    }
  }
}
