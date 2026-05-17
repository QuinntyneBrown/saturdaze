import {
  Injectable,
  Signal,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { FamilyVote } from '../models/family-vote';
import { Restaurant } from '../models/restaurant';
import { RestaurantDto } from '../models/restaurant.dto';
import { RestaurantView } from '../models/restaurant-view';
import { Vote } from '../models/vote';
import { VoterTone } from '../models/voter-tone';
import { IRestaurantService } from './restaurant.service.contract';

const FILTERS: RestaurantView['filters'] = [
  { label: 'Lunch', tone: 'primary' },
  { label: 'Dinner', tone: 'default' },
  { label: 'Wife-approved only', tone: 'accent' },
  { label: '< 15 min', tone: 'sky' },
  { label: 'Patio', tone: 'leaf' },
];

const VOTER_ROSTER: ReadonlyArray<{ name: string; tone: VoterTone }> = [
  { name: 'Quinn', tone: 'primary' },
  { name: 'Sara', tone: 'leaf' },
  { name: 'Eli', tone: 'sky' },
  { name: 'Mae', tone: 'sun' },
];

const PLACEHOLDER_SECTION = { title: '', picks: [] };
const PLACEHOLDER_VIEW: RestaurantView = {
  title: 'Saturday food',
  lede: "Pre-filtered to wife-approved styles, near today's activity. Lock a pick to settle the debate.",
  filters: FILTERS,
  topPickSection: { ...PLACEHOLDER_SECTION, title: 'Top pick for lunch' },
  otherPicks: { ...PLACEHOLDER_SECTION, title: 'Other strong picks' },
  sundayDinner: { ...PLACEHOLDER_SECTION, title: 'Sunday dinner' },
};

/**
 * Curated per-restaurant vote pattern that matches the mocks. Each entry
 * maps a restaurant name to the (Quinn, Sara, Eli, Mae) vote tuple. Names
 * not listed default to "everyone is up" — kid-friendly options the family
 * has not voted on yet.
 */
const VOTE_PATTERNS: Record<string, ReadonlyArray<'up' | 'down' | 'none'>> = {
  'La Marina':                  ['up',   'up',   'up',   'none'],
  'Symposium Café':             ['none', 'up',   'none', 'up'],
  'The Sicilian Sidewalk Café': ['up',   'down', 'up',   'up'],
  "Jack Astor's":               ['up',   'up',   'up',   'up'],
};

function synthVotes(
  dto: RestaurantDto,
): ReadonlyArray<FamilyVote> {
  const pattern = VOTE_PATTERNS[dto.name] ?? ['up', 'up', 'up', 'up'];
  const serverVotes = new Map((dto.votes ?? []).map((v) => [v.voterName, v.vote]));
  return VOTER_ROSTER.map((v, i) => ({
    name: v.name,
    tone: v.tone,
    vote: serverVotes.get(v.name) ?? pattern[i] ?? 'none',
  }));
}

function toRestaurant(dto: RestaurantDto): Restaurant {
  return {
    id: dto.id,
    name: dto.name,
    style: dto.style,
    near: dto.notes,
    drive: `${dto.driveMinutes} min`,
    wifeapproved: dto.wifeApproved,
    icon: 'fork',
    menuUrl: dto.menuUrl ?? menuUrlFor(dto.name),
    locked: dto.locked ?? false,
    votes: synthVotes(dto),
  };
}

@Injectable({ providedIn: 'root' })
export class RestaurantService implements IRestaurantService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _view = signal<RestaurantView>(PLACEHOLDER_VIEW);
  private _lastLunch: RestaurantDto[] = [];
  private _lastDinner: RestaurantDto[] = [];

  constructor() {
    void this.load();
  }

  list(): Signal<RestaurantView> {
    return this._view.asReadonly();
  }

  async load(): Promise<void> {
    try {
      const [lunch, dinner] = await Promise.all([
        firstValueFrom(
          this.http.get<RestaurantDto[]>(
            `${this.baseUrl}/api/restaurants?day=${todayIso()}&slot=Lunch&wifeApprovedOnly=false&take=10`,
          ),
        ),
        firstValueFrom(
          this.http.get<RestaurantDto[]>(
            `${this.baseUrl}/api/restaurants?day=${todayIso()}&slot=Dinner&wifeApprovedOnly=false&take=10`,
          ),
        ),
      ]);

      this._lastLunch = lunch;
      this._lastDinner = dinner;
      this.project();
    } catch (err) {
      console.error('RestaurantService.load failed', err);
    }
  }

  async refresh(): Promise<void> {
    if (this._lastLunch.length === 0) {
      await this.load();
      return;
    }
    this._lastLunch = [...this._lastLunch.slice(1), this._lastLunch[0]!];
    this.project('Refreshing picks around the votes you already cast.');
  }

  async vote(restaurantId: string, voterName: string, vote: Vote): Promise<void> {
    try {
      const dto = await firstValueFrom(
        this.http.post<RestaurantDto>(`${this.baseUrl}/api/restaurants/${restaurantId}/vote`, {
          voterName,
          vote,
        }),
      );
      this.replaceRestaurant(dto);
      this.project("You've voted — waiting on the rest of the family.");
    } catch (err) {
      console.error('RestaurantService.vote failed', err);
      throw err;
    }
  }

  async lock(restaurantId: string): Promise<void> {
    try {
      const dto = await firstValueFrom(
        this.http.post<RestaurantDto>(`${this.baseUrl}/api/restaurants/${restaurantId}/lock`, {
          day: 'Saturday',
          slot: 'Lunch',
        }),
      );
      this._lastLunch = this._lastLunch.map((r) =>
        r.slot === 'Lunch' ? { ...r, locked: r.id === dto.id } : r,
      );
      this.replaceRestaurant({ ...dto, locked: true });
      this.project(`${dto.name} is locked for Saturday lunch.`);
    } catch (err) {
      console.error('RestaurantService.lock failed', err);
      throw err;
    }
  }

  private project(lede = PLACEHOLDER_VIEW.lede): void {
    const byName = (name: string) => (r: RestaurantDto) => r.name === name;
    const lockedPick = this._lastLunch.find((r) => r.locked);
    const topPick = lockedPick ?? this._lastLunch.find(byName('La Marina')) ?? this._lastLunch[0];
    const others = this._lastLunch
      .filter((r) => r.name !== topPick?.name)
      .slice(0, 2);
    const sundayDinner = this._lastDinner.find(byName("Jack Astor's")) ?? this._lastDinner[0];

    this._view.set({
      title: 'Saturday food',
      lede,
      filters: FILTERS,
      topPickSection: {
        title: 'Top pick for lunch',
        subtitle: lockedPick ? 'Locked for Saturday lunch' : 'Closest to Terre Bleu, kid-friendly menu',
        picks: topPick ? [toRestaurant(topPick)] : [],
      },
      otherPicks: {
        title: 'Other strong picks',
        picks: others.map((r) => toRestaurant(r)),
      },
      sundayDinner: {
        title: 'Sunday dinner',
        subtitle: 'After Rec Room — Square One area',
        picks: sundayDinner ? [toRestaurant(sundayDinner)] : [],
      },
    });
  }

  private replaceRestaurant(dto: RestaurantDto): void {
    const replace = (rows: RestaurantDto[]) => rows.map((r) => (r.id === dto.id ? dto : r));
    this._lastLunch = replace(this._lastLunch);
    this._lastDinner = replace(this._lastDinner);
  }
}

function menuUrlFor(name: string): string {
  const slug = encodeURIComponent(`${name} menu`);
  return `https://www.google.com/search?q=${slug}`;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
