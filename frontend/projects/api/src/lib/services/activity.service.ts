import {
  Injectable,
  Signal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { forecastFor, isOutdoorFriendly, weatherWord } from '../api/weather';
import { upcomingSaturdayIso } from '../api/weekend-dates';
import { Activity } from '../models/activity';
import { ActivityDto } from '../models/activity.dto';
import { ActivitySection } from '../models/activity-section';
import { ActivityTone } from '../models/activity-tone';
import { ActivityView } from '../models/activity-view';
import { FilterDef } from '../models/filter-def';
import { WeatherForecastDto } from '../models/weather-forecast.dto';
import { IActivityService } from './activity.service.contract';

const ALL = 'All';

const FILTER_DEFS: ReadonlyArray<FilterDef> = [
  { label: ALL, tone: 'default' },
  { label: 'Outdoor', tone: 'leaf', match: (a) => !a.indoor },
  { label: 'Indoor', tone: 'indoor', match: (a) => a.indoor },
  { label: '< 30 min', tone: 'sky', match: (a) => a.driveMinutes < 30 },
  { label: 'Ages 5+', tone: 'default', match: (a) => a.minAge <= 5 },
  {
    label: 'Weather-safe',
    tone: 'warn',
    match: (a) => a.weatherTags.some((t) => t === 'rain' || t === 'cold' || t === 'snow'),
  },
];

const SECTION_LIMIT = 3;

/**
 * Icon For.
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
 * Age String.
 */
function ageString(dto: ActivityDto): string | undefined {
  if (dto.minAge <= 2 && dto.maxAge >= 99) return 'all';
  if (dto.maxAge >= 99) return `${dto.minAge}+`;
  return `${dto.minAge}–${dto.maxAge}`;
}

/**
 * To Activity.
 */
function toActivity(dto: ActivityDto, tag?: string): Activity {
  return {
    title: dto.name,
    subtitle: dto.description || undefined,
    icon: iconFor(dto),
    tone: toneFor(dto),
    drive: `${dto.driveMinutes} min`,
    ages: ageString(dto),
    tag,
  };
}

/** True when the activity's own weather tags fit the forecast. */
function fitsForecast(a: ActivityDto, forecast: WeatherForecastDto | null): boolean {
  if (!forecast || forecast.unavailable || a.weatherTags.length === 0) return true;
  return a.weatherTags.some((t) => forecast.tags.includes(t));
}

/**
 * Group the catalogue into the three spec'd sections (L2-018):
 *   - weather-fit: outdoor picks when the forecast allows, indoor otherwise
 *   - "If weather turns": the opposite set
 *   - "Try something new": the server's `tryNew` picks the family hasn't done
 */
function buildSections(
  rows: ReadonlyArray<ActivityDto>,
  tryNew: ReadonlyArray<ActivityDto>,
  forecast: WeatherForecastDto | null,
): ActivitySection[] {
  const outdoorDay = isOutdoorFriendly(forecast);
  const used = new Set<string>();
  const take = (pool: ReadonlyArray<ActivityDto>): ActivityDto[] => {
    const picked = pool.filter((a) => !used.has(a.id)).slice(0, SECTION_LIMIT);
    picked.forEach((a) => used.add(a.id));
    return picked;
  };

  const outdoor = rows.filter((a) => !a.indoor && fitsForecast(a, forecast));
  const indoor = rows.filter((a) => a.indoor);
  const weatherFit = take(outdoorDay ? outdoor : indoor);
  const ifTurns = take(outdoorDay ? indoor : rows.filter((a) => !a.indoor));
  const fresh = take(tryNew);

  const word = weatherWord(forecast);
  return [
    {
      title: "This weekend's weather-fit",
      subtitle: forecast && !forecast.unavailable
        ? `Saturday looks ${word} — ${outdoorDay ? 'outdoor first' : 'indoor first'}`
        : undefined,
      activities: weatherFit.map((a) => toActivity(a)),
    },
    {
      title: 'If weather turns',
      activities: ifTurns.map((a) => toActivity(a)),
    },
    {
      title: 'Try something new',
      subtitle: "You haven't done these recently",
      activities: fresh.map((a) => toActivity(a, 'First time')),
    },
  ];
}

@Injectable({ providedIn: 'root' })
export class ActivityService implements IActivityService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _rows = signal<ReadonlyArray<ActivityDto>>([]);
  private readonly _tryNew = signal<ReadonlyArray<ActivityDto>>([]);
  private readonly _forecast = signal<WeatherForecastDto | null>(null);
  private readonly _filter = signal<string>(ALL);

  private readonly _view = computed<ActivityView>(() => {
    const rows = this._rows();
    const filter = this._filter();
    const def = FILTER_DEFS.find((f) => f.label === filter);
    const match = def?.match;

    const sections = buildSections(
      match ? rows.filter(match) : rows,
      match ? this._tryNew().filter(match) : this._tryNew(),
      this._forecast(),
    ).filter((s) => !match || s.activities.length > 0);

    const filters = FILTER_DEFS
      .filter((f) => !f.match || rows.some(f.match))
      .map((f) => ({ label: f.label, tone: f.label === filter ? 'primary' as const : f.tone }));

    return { filters, sections };
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
   * @returns {Signal<ActivityView>} The result of the operation
   */
  list(): Signal<ActivityView> {
    return this._view;
  }

  /**
   * Active Filter.
   *
   * @returns {Signal<string>} The result of the operation
   */
  activeFilter(): Signal<string> {
    return this._filter.asReadonly();
  }

  /**
   * Set Filter.
   *
   * @param {string} label - The chip label
   */
  setFilter(label: string): void {
    this._filter.set(label);
  }

  /**
   * Load — the catalogue, the "try new" picks, and the Saturday forecast.
   * A missing forecast degrades to an indoor-first grouping.
   *
   * @returns {Promise<void>} The result of the operation
   */
  async load(): Promise<void> {
    const weekendOf = upcomingSaturdayIso();
    try {
      const [rows, tryNew, weather] = await Promise.all([
        firstValueFrom(this.http.get<ActivityDto[]>(`${this.baseUrl}/api/activities`)),
        firstValueFrom(this.http.get<ActivityDto[]>(`${this.baseUrl}/api/activities?tryNew=true`))
          .catch(() => [] as ActivityDto[]),
        firstValueFrom(this.http.get<WeatherForecastDto[]>(`${this.baseUrl}/api/weather?weekendOf=${weekendOf}`))
          .catch(() => [] as WeatherForecastDto[]),
      ]);
      this._rows.set(rows ?? []);
      this._tryNew.set(tryNew ?? []);
      this._forecast.set(forecastFor(weather ?? [], weekendOf));
    } catch (err) {
      console.error('ActivityService.load failed', err);
    }
  }
}
