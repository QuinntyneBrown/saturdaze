import {
  Injectable,
  Signal,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { Activity } from '../models/activity';
import { ActivityDto } from '../models/activity.dto';
import { ActivityTone } from '../models/activity-tone';
import { ActivityView } from '../models/activity-view';
import { FilterDef } from '../models/filter-def';
import { PresentationOverlay } from '../models/presentation-overlay';
import { IActivityService } from './activity.service.contract';

const FILTER_DEFS: ReadonlyArray<FilterDef> = [
  { label: 'All', tone: 'primary' },
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

function buildFilters(rows: ReadonlyArray<ActivityDto>): ActivityView['filters'] {
  return FILTER_DEFS
    .filter((f) => !f.match || rows.some(f.match))
    .map((f) => ({ label: f.label, tone: f.tone }));
}

const PLACEHOLDER_VIEW: ActivityView = {
  filters: FILTER_DEFS.filter((f) => !f.match).map((f) => ({ label: f.label, tone: f.tone })),
  sections: [],
};

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

const ACTIVITY_OVERLAYS: Record<string, PresentationOverlay> = {
  'Terre Bleu Lavender Farm': {
    subtitle: 'Milton · The bloom peaks May 17–24',
    ages: 'all',
    tag: 'Day highlight',
    why: "Sara loved this last summer. Mae's old enough this year to walk the rows.",
  },
  'Bronte Creek Provincial Park': {
    subtitle: 'Easy hike + splash pad if hot',
    ages: '5+',
    why: 'Short trail (1.5km), washrooms, picnic tables — your usual win.',
  },
  'Royal Botanical Gardens': {
    subtitle: 'Tulip festival in bloom',
  },
  'The Rec Room — Square One': {
    subtitle: 'Bowling, arcade, dinner under one roof',
    ages: 'all',
    tag: "Eli's pick",
    why: 'Eli asked for it twice last week. Sunday afternoon clouds = good window.',
  },
  'Ontario Science Centre': {
    subtitle: "New 'Senses' exhibit",
  },
  'Toronto Zoo': {
    subtitle: 'Polar bears, splash zone, indoor pavilions',
    ages: 'all',
  },
  'Riverwood Conservancy': {
    subtitle: 'Forest school trails, owl barn',
    tag: 'First time',
  },
  "Living Arts Centre — kids' theatre": {
    subtitle: 'Saturday matinée at 2pm',
    tag: 'First time',
  },
};

function toActivity(dto: ActivityDto): Activity {
  const overlay = ACTIVITY_OVERLAYS[dto.name] ?? {};
  return {
    title: dto.name,
    subtitle: overlay.subtitle ?? dto.description,
    icon: iconFor(dto),
    tone: toneFor(dto),
    drive: `${dto.driveMinutes} min`,
    ages: overlay.ages ?? ageString(dto),
    tag: overlay.tag,
    why: overlay.why,
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
export class ActivityService implements IActivityService {
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
      this._view.set({ filters: buildFilters(rows), sections: groupSections(rows) });
    } catch (err) {
      console.error('ActivityService.load failed', err);
    }
  }
}
