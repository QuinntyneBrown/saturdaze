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
import { FamilyProfile } from '../models/family-profile';
import { PreferenceToggle } from '../models/preference-toggle';
import {
  EditableFamilyProfile,
  IFamilyService,
} from './family.service.contract';

/**
 * Initial profile rendered while the HTTP call is still in flight. Likes
 * render empty so there's no flash of mock content before the real data
 * lands; the toggles show their defaults.
 */
const PLACEHOLDER_PROFILE: FamilyProfile = {
  familyName: null,
  location: '',
  likes: [],
  preferences: preferenceToggles({
    budgetEnabled: false,
    tryNewEnabled: false,
    fridayPreviewEnabled: true,
  }),
};

/**
 * The three family-level switches, phrased for the profile page.
 */
function preferenceToggles(flags: {
  budgetEnabled: boolean;
  tryNewEnabled: boolean;
  fridayPreviewEnabled: boolean;
}): PreferenceToggle[] {
  return [
    {
      key: 'budget',
      title: 'Budget is a factor',
      subtitle: flags.budgetEnabled
        ? 'On — picks will filter by price'
        : "Off — I won't filter by price",
      checked: flags.budgetEnabled,
    },
    {
      key: 'tryNew',
      title: 'Try something new each weekend',
      subtitle: flags.tryNewEnabled
        ? 'On — one new activity per weekend'
        : 'Off — stick with the family favourites',
      checked: flags.tryNewEnabled,
    },
    {
      key: 'fridayPreview',
      title: 'Friday preview notifications',
      subtitle: flags.fridayPreviewEnabled
        ? 'On — a heads-up at 6pm Friday'
        : 'Off — no Friday heads-up',
      checked: flags.fridayPreviewEnabled,
    },
  ];
}

/**
 * Map Family.
 */
function mapFamily(dto: FamilyDto): FamilyProfile {
  const name = dto.name?.trim();
  return {
    familyName: name ? name : null,
    location: dto.homeLocation,
    likes: dto.preferences.map((p) => ({
      label: p.value,
      tone: p.kind === 'Like' ? 'leaf' : 'warn',
      icon: p.kind === 'Like' ? 'heart' : 'close',
    })),
    preferences: preferenceToggles(dto),
  };
}

/**
 * Map Editable.
 */
function mapEditable(dto: FamilyDto): EditableFamilyProfile {
  return {
    name: dto.name,
    homeLocation: dto.homeLocation,
    budgetEnabled: dto.budgetEnabled,
    tryNewEnabled: dto.tryNewEnabled,
    fridayPreviewEnabled: dto.fridayPreviewEnabled,
    members: dto.members
      .slice()
      .sort((a, b) => b.age - a.age)
      .map((m) => ({
        id: m.id,
        name: m.name,
        age: m.age,
      })),
    commitments: dto.commitments.map((c) => ({
      id: c.id,
      title: c.title,
      dayOfWeek: c.dayOfWeek as EditableFamilyProfile['commitments'][number]['dayOfWeek'],
      startTime: c.startTime.substring(0, 5),
      endTime: c.endTime.substring(0, 5),
    })),
    preferences: dto.preferences.map((p) => ({
      kind: p.kind,
      value: p.value,
    })),
  };
}

/**
 * Normalize Time.
 */
function normalizeTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

@Injectable({ providedIn: 'root' })
export class FamilyService implements IFamilyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _profile = signal<FamilyProfile>(PLACEHOLDER_PROFILE);
  private readonly _editableProfile = signal<EditableFamilyProfile | null>(null);

  /**
   * Constructor.
   */
  constructor() {
    void this.load();
  }

  /**
   * Get Profile.
   *
   * @returns {Signal<FamilyProfile>} The result of the operation
   */
  getProfile(): Signal<FamilyProfile> {
    return this._profile.asReadonly();
  }

  getEditableProfile(): Signal<EditableFamilyProfile | null> {
    return this._editableProfile.asReadonly();
  }

  /**
   * Load.
   *
   * @returns {Promise<void>} The result of the operation
   */
  async load(): Promise<void> {
    try {
      const dto = await firstValueFrom(
        this.http.get<FamilyDto>(`${this.baseUrl}/api/family`),
      );
      this.apply(dto);
    } catch (err) {
      console.error('FamilyService.load failed', err);
    }
  }

  /**
   * Save Profile.
   *
   * @param {EditableFamilyProfile} profile - The profile
   *
   * @returns {Promise<void>} The result of the operation
   */
  async saveProfile(profile: EditableFamilyProfile): Promise<void> {
    const dto = await firstValueFrom(
      this.http.put<FamilyDto>(`${this.baseUrl}/api/family`, {
        name: profile.name?.trim() || null,
        homeLocation: profile.homeLocation,
        budgetEnabled: profile.budgetEnabled,
        tryNewEnabled: profile.tryNewEnabled,
        fridayPreviewEnabled: profile.fridayPreviewEnabled,
        members: profile.members.map((m) => ({
          id: m.id ?? null,
          name: m.name.trim(),
          age: m.age,
        })),
        commitments: profile.commitments.map((c) => ({
          id: c.id ?? null,
          title: c.title.trim(),
          dayOfWeek: c.dayOfWeek,
          startTime: normalizeTime(c.startTime),
          endTime: normalizeTime(c.endTime),
        })),
        preferences: profile.preferences.map((p) => ({
          kind: p.kind,
          value: p.value,
        })),
      }),
    );
    this.apply(dto);
  }

  /**
   * Apply.
   */
  private apply(dto: FamilyDto | null): void {
    if (!dto) return;
    this._profile.set(mapFamily(dto));
    this._editableProfile.set(mapEditable(dto));
  }
}
