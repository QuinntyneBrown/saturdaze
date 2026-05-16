import {
  Injectable,
  Signal,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { Activity, ActivityTone, ActivityView } from '../models/activity';

/**
 * Server-side shape of one row from `GET /api/activities`. Mirrors
 * `Saturdaze.Application.Contracts.ActivityDto`.
 */
interface ActivityDto {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly indoor: boolean;
  readonly minAge: number;
  readonly maxAge: number;
  readonly driveMinutes: number;
  readonly weatherTags: ReadonlyArray<string>;
  readonly typicalDurationMinutes: number;
  readonly description: string;
  readonly mapUrl: string;
}

/** Filter row is presentation-only — the backend has no filter concept yet. */
const FILTERS: ActivityView['filters'] = [
  { label: 'All', tone: 'primary' },
  { label: 'Outdoor', tone: 'leaf' },
  { label: 'Indoor', tone: 'indoor' },
  { label: '< 30 min', tone: 'sky' },
  { label: 'Ages 5+', tone: 'default' },
  { label: 'New for us', tone: 'default' },
  { label: 'Weather-safe', tone: 'warn' },
];

const PLACEHOLDER_VIEW: ActivityView = { filters: FILTERS, sections: [] };

function iconFor(dto: ActivityDto): string {
  const c = dto.category.toLowerCase();
  if (c.includes('theatre')) return 'ticket';
  if (c.includes('indoor') || c.includes('museum')) return 'popcorn';
  return 'tree';
}

function toneFor(dto: ActivityDto): ActivityTone {
  return dto.indoor ? 'indoor' : 'outdoor';
}

function ageString(dto: ActivityDto): string | undefined {
  if (dto.minAge <= 2 && dto.maxAge >= 99) return 'all';
  if (dto.maxAge >= 99) return `${dto.minAge}+`;
  return `${dto.minAge}–${dto.maxAge}`;
}

function toActivity(dto: ActivityDto): Activity {
  return {
    title: dto.name,
    subtitle: dto.description,
    icon: iconFor(dto),
    tone: toneFor(dto),
    drive: `${dto.driveMinutes} min`,
    ages: ageString(dto),
  };
}

/**
 * Group the flat catalog into three sections that mirror the mocks. Until
 * a planner-aware classification ships, this is a deterministic split:
 *   - "weather-fit" = outdoor with sunny/mild tags (top 3 by drive)
 *   - "if weather turns" = indoor, plus Toronto Zoo (indoor pavilions)
 *   - "try something new" = whatever's left
 */
function groupSections(dtos: ReadonlyArray<ActivityDto>): ActivityView['sections'] {
  const outdoor = dtos
    .filter((a) => !a.indoor && a.weatherTags.includes('sunny'))
    .slice(0, 3);
  const usedIds = new Set(outdoor.map((a) => a.id));

  const indoor = dtos
    .filter((a) => !usedIds.has(a.id) && (a.indoor || a.name.toLowerCase().includes('zoo')))
    .slice(0, 3);
  indoor.forEach((a) => usedIds.add(a.id));

  const newish = dtos.filter((a) => !usedIds.has(a.id)).slice(0, 2);

  return [
    {
      title: "This weekend's weather-fit",
      activities: outdoor.map(toActivity),
    },
    {
      title: 'If weather turns',
      activities: indoor.map(toActivity),
    },
    {
      title: 'Try something new',
      subtitle: "You haven't done these recently",
      activities: newish.map(toActivity),
    },
  ];
}

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _view = signal<ActivityView>(PLACEHOLDER_VIEW);

  constructor() {
    void this.load();
  }

  list(): Signal<ActivityView> {
    return this._view.asReadonly();
  }

  async load(): Promise<void> {
    try {
      const rows = await firstValueFrom(
        this.http.get<ActivityDto[]>(`${this.baseUrl}/api/activities`),
      );
      this._view.set({ filters: FILTERS, sections: groupSections(rows) });
    } catch (err) {
      console.error('ActivityService.load failed', err);
    }
  }
}
