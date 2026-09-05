import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import {
  commitmentDayLabel,
  commitmentSubtitle,
  commitmentsSummary,
  joinNames,
  memberRole,
  memberSubtitle,
  membersSummary,
} from '../api/family-presentation';
import { initialOf } from '../api/format';
import { ChipView } from '../models/chip-view';
import { CommitmentRow } from '../models/commitment-row';
import { DayOfWeek } from '../models/day-of-week';
import { FamilyDto } from '../models/family.dto';
import { memberTone } from '../models/family-member-tone';
import { FamilyView } from '../models/family-view';
import { MemberRow } from '../models/member-row';
import { PlannedAroundRow } from '../models/planned-around-row';
import { PreferenceToggle } from '../models/preference-toggle';
import { EditableFamilyProfile, IFamilyService } from './family.service.contract';

const HEADLINE_UNNAMED = 'Your family';
const SUBTITLE_TAIL = 'Every weekend is planned around this.';
const HOME_HINT = 'Weather and drive times start here';

/**
 * The three family-level switches, phrased for the Family page.
 */
function preferenceToggles(flags: {
  budgetEnabled: boolean;
  tryNewEnabled: boolean;
  fridayPreviewEnabled: boolean;
}): PreferenceToggle[] {
  return [
    {
      key: 'budget',
      title: 'Budget matters',
      subtitle: 'Prefer free and low-cost picks',
      checked: flags.budgetEnabled,
    },
    {
      key: 'tryNew',
      title: 'Try something new each weekend',
      subtitle: 'One first-time activity per weekend',
      checked: flags.tryNewEnabled,
    },
    {
      key: 'fridayPreview',
      title: 'Friday preview email',
      subtitle: 'A draft in your inbox at 6pm Friday',
      checked: flags.fridayPreviewEnabled,
    },
  ];
}

/**
 * Rendered until the HTTP call lands: nothing invented, toggles at their
 * defaults.
 */
const LOADING_VIEW: FamilyView = {
  status: 'loading',
  headline: HEADLINE_UNNAMED,
  subtitle: SUBTITLE_TAIL,
  home: { location: '', hint: HOME_HINT },
  members: [],
  commitments: [],
  likes: [],
  dislikes: [],
  preferences: preferenceToggles({
    budgetEnabled: false,
    tryNewEnabled: false,
    fridayPreviewEnabled: true,
  }),
  plannedAround: [],
};

/** "Port Credit. Every weekend is planned around this." */
function subtitleFor(home: string): string {
  return home ? `${home}. ${SUBTITLE_TAIL}` : SUBTITLE_TAIL;
}

function toMemberRow(m: FamilyDto['members'][number], index: number): MemberRow {
  return {
    id: m.id,
    name: m.name,
    initial: initialOf(m.name),
    tone: memberTone(index),
    age: m.age,
    role: memberRole(m.age),
    subtitle: memberSubtitle(m),
  };
}

function toCommitmentRow(c: FamilyDto['commitments'][number]): CommitmentRow {
  const dayOfWeek = c.dayOfWeek as DayOfWeek;
  const startTime = c.startTime.substring(0, 5);
  const endTime = c.endTime.substring(0, 5);
  return {
    id: c.id,
    title: c.title,
    dayOfWeek,
    dayLabel: commitmentDayLabel(dayOfWeek),
    startTime,
    endTime,
    subtitle: commitmentSubtitle({ dayOfWeek, startTime, endTime }),
    icon: 'lock',
  };
}

/**
 * Planned Around — the three rows on the empty Weekend screen.
 */
function plannedAround(
  dto: FamilyDto,
  name: string | null,
  sortedMembers: FamilyDto['members'],
): PlannedAroundRow[] {
  const likes = dto.preferences.filter((p) => p.kind === 'Like').map((p) => p.value.toLowerCase());
  const dislikes = dto.preferences
    .filter((p) => p.kind === 'Dislike')
    .map((p) => p.value.toLowerCase());
  const count = dto.commitments.length;
  return [
    {
      icon: 'user',
      title: [name ?? HEADLINE_UNNAMED, dto.homeLocation].filter((s) => !!s).join(', '),
      subtitle: membersSummary(sortedMembers),
      href: '/family',
    },
    {
      icon: 'lock',
      title: count === 0 ? 'No commitments' : `${count} commitment${count === 1 ? '' : 's'}`,
      subtitle: commitmentsSummary(
        dto.commitments.map((c) => ({ ...c, dayOfWeek: c.dayOfWeek as DayOfWeek })),
      ),
      href: '/family',
    },
    {
      icon: 'heart',
      title: likes.length > 0 ? `Likes ${joinNames(likes.slice(0, 2))}` : 'No likes yet',
      subtitle: dislikes.length > 0 ? `No ${dislikes.join(' · ')}` : 'Nothing ruled out',
      href: '/family',
    },
  ];
}

/**
 * Map Family.
 */
function mapFamily(dto: FamilyDto): FamilyView {
  const trimmed = dto.name?.trim();
  const name = trimmed ? trimmed : null;
  const sortedMembers = dto.members.slice().sort((a, b) => b.age - a.age);
  const likes: ChipView[] = dto.preferences
    .filter((p) => p.kind === 'Like')
    .map((p) => ({ tone: 'leaf', icon: 'heart', label: p.value }));
  const dislikes: ChipView[] = dto.preferences
    .filter((p) => p.kind === 'Dislike')
    .map((p) => ({ tone: 'warn', icon: 'close', label: p.value }));
  return {
    status: 'ready',
    headline: name ?? HEADLINE_UNNAMED,
    subtitle: subtitleFor(dto.homeLocation),
    home: { location: dto.homeLocation, hint: HOME_HINT },
    members: sortedMembers.map(toMemberRow),
    commitments: dto.commitments.map(toCommitmentRow),
    likes,
    dislikes,
    preferences: preferenceToggles(dto),
    plannedAround: plannedAround(dto, name, sortedMembers),
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
      .map((m) => ({ id: m.id, name: m.name, age: m.age })),
    commitments: dto.commitments.map((c) => ({
      id: c.id,
      title: c.title,
      dayOfWeek: c.dayOfWeek as DayOfWeek,
      startTime: c.startTime.substring(0, 5),
      endTime: c.endTime.substring(0, 5),
    })),
    preferences: dto.preferences.map((p) => ({ kind: p.kind, value: p.value })),
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

  private readonly _family = signal<FamilyView>(LOADING_VIEW);
  private readonly _editableProfile = signal<EditableFamilyProfile | null>(null);

  /**
   * Constructor.
   */
  constructor() {
    void this.load();
  }

  /**
   * Get Family.
   *
   * @returns {Signal<FamilyView>} The result of the operation
   */
  getFamily(): Signal<FamilyView> {
    return this._family.asReadonly();
  }

  /**
   * Get Editable Profile.
   *
   * @returns {Signal<EditableFamilyProfile | null>} The result of the operation
   */
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
      const dto = await firstValueFrom(this.http.get<FamilyDto>(`${this.baseUrl}/api/family`));
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
        preferences: profile.preferences.map((p) => ({ kind: p.kind, value: p.value })),
      }),
    );
    this.apply(dto);
  }

  /**
   * Apply.
   */
  private apply(dto: FamilyDto | null): void {
    if (!dto) return;
    this._family.set(mapFamily(dto));
    this._editableProfile.set(mapEditable(dto));
  }
}
