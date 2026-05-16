import {
  Injectable,
  Signal,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { FamilyDto } from '../models/family.dto';
import { FamilyMember } from '../models/family-member';
import { FamilyMemberTone } from '../models/family-member-tone';
import { FamilyProfile } from '../models/family-profile';
import { PreferenceToggle } from '../models/preference-toggle';
import { IFamilyService } from './family.service.contract';

/**
 * Initial profile rendered while the HTTP call is still in flight. The
 * commitments and members render empty so there's no flash of mock content
 * before the real data lands. Rhythm and preferences are local-only
 * concepts the API doesn't yet model — they stay constant.
 */
const PLACEHOLDER_PROFILE: FamilyProfile = {
  familyName: 'The Browns',
  location: 'Port Credit, Mississauga',
  members: [],
  commitments: [],
  rhythm: [
    { title: 'Out the door by', subtitle: '9:00am', icon: 'home', chip: '9:00am' },
    { title: 'Kids in bed by', subtitle: '9:00pm sharp', icon: 'bed', chip: '9:00pm' },
  ],
  likes: [],
  preferences: [
    { title: 'Budget is a factor', subtitle: "Off — I won't filter by price", checked: false },
    { title: 'Try something new each weekend', subtitle: 'One new activity per week', checked: true },
    { title: 'Friday preview notifications', subtitle: 'A heads-up at 6pm Friday', checked: true },
  ],
};

/** Stable tone rotation for member avatars, oldest first. */
const MEMBER_TONES: readonly FamilyMemberTone[] = ['primary', 'leaf', 'sky', 'sun', 'indoor'];

/** Stable icon assignment for commitments by title heuristic. */
function commitmentIcon(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('swim') || t.includes('workout') || t.includes('bike')) return 'bike';
  if (t.includes('church') || t.includes('bed')) return 'bed';
  if (t.includes('lunch') || t.includes('dinner')) return 'fork';
  return 'calendar';
}

function commitmentSubtitle(c: FamilyDto['commitments'][number]): string {
  const day =
    c.dayOfWeek === 'Saturday' ? 'Saturdays' :
    c.dayOfWeek === 'Sunday' ? 'Sundays' :
    c.dayOfWeek + 's';
  const start = c.startTime.substring(0, 5);
  const end = c.endTime.substring(0, 5);
  return `${day} ${start} – ${end}`;
}

function memberSubtitle(m: FamilyDto['members'][number]): string {
  const role = m.age >= 18 ? 'Parent' : 'Kid';
  return `${role} · ${m.age}`;
}

function mapFamily(dto: FamilyDto): FamilyProfile {
  const members: FamilyMember[] = dto.members
    .slice()
    .sort((a, b) => b.age - a.age)
    .map((m, i) => ({
      name: m.name,
      tone: MEMBER_TONES[i % MEMBER_TONES.length]!,
      subtitle: memberSubtitle(m),
    }));

  const preferences: PreferenceToggle[] = [
    {
      title: 'Budget is a factor',
      subtitle: dto.budgetEnabled
        ? 'On — picks will filter by price'
        : "Off — I won't filter by price",
      checked: dto.budgetEnabled,
    },
    ...PLACEHOLDER_PROFILE.preferences.slice(1),
  ];

  return {
    familyName: 'The Browns',
    location: dto.homeLocation,
    members,
    commitments: dto.commitments.map((c) => ({
      title: c.title,
      subtitle: commitmentSubtitle(c),
      icon: commitmentIcon(c.title),
    })),
    rhythm: PLACEHOLDER_PROFILE.rhythm,
    likes: dto.preferences.map((p) => ({
      label: p.value,
      tone: p.kind === 'Like' ? 'leaf' : 'warn',
      icon: p.kind === 'Like' ? 'heart' : 'close',
    })),
    preferences,
  };
}

@Injectable({ providedIn: 'root' })
export class FamilyService implements IFamilyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _profile = signal<FamilyProfile>(PLACEHOLDER_PROFILE);

  constructor() {
    void this.load();
  }

  getProfile(): Signal<FamilyProfile> {
    return this._profile.asReadonly();
  }

  async load(): Promise<void> {
    try {
      const dto = await firstValueFrom(
        this.http.get<FamilyDto>(`${this.baseUrl}/api/family`),
      );
      this._profile.set(mapFamily(dto));
    } catch (err) {
      console.error('FamilyService.load failed', err);
    }
  }
}
