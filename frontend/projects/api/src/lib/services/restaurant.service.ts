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
import { VoterTone } from '../models/voter-tone';
import { IRestaurantService } from './restaurant.service.contract';

const FILTERS: RestaurantView['filters'] = [
  { label: 'Lunch', tone: 'primary' },
  { label: 'Dinner', tone: 'default' },
  { label: 'Wife-approved only', tone: 'accent' },
  { label: '< 15 min', tone: 'sky' },
  { label: 'Patio', tone: 'leaf' },
];

/**
 * Votes are a presentation-only construct in v1 — the backend has no vote
 * model yet. We synthesise deterministic votes from a fixed family roster
 * so the UI keeps its mock shape until vote-state moves server-side.
 */
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
 *
 * Votes live frontend-side until the backend grows a vote model.
 */
const VOTE_PATTERNS: Record<string, ReadonlyArray<'up' | 'down' | 'none'>> = {
  'La Marina':                  ['up',   'up',   'up',   'none'],
  'Symposium Café':             ['none', 'up',   'none', 'up'],
  'The Sicilian Sidewalk Café': ['up',   'down', 'up',   'up'],
  "Jack Astor's":               ['up',   'up',   'up',   'up'],
};

function synthVotes(restaurantName: string): ReadonlyArray<FamilyVote> {
  const pattern = VOTE_PATTERNS[restaurantName] ?? ['up', 'up', 'up', 'up'];
  return VOTER_ROSTER.map((v, i) => ({
    name: v.name,
    tone: v.tone,
    vote: pattern[i] ?? 'none',
  }));
}

function toRestaurant(dto: RestaurantDto): Restaurant {
  return {
    name: dto.name,
    style: dto.style,
    near: dto.notes,
    drive: `${dto.driveMinutes} min`,
    wifeapproved: dto.wifeApproved,
    icon: 'fork',
    votes: synthVotes(dto.name),
  };
}

@Injectable({ providedIn: 'root' })
export class RestaurantService implements IRestaurantService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _view = signal<RestaurantView>(PLACEHOLDER_VIEW);

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
            `${this.baseUrl}/api/restaurants?slot=Lunch&wifeApprovedOnly=false&take=10`,
          ),
        ),
        firstValueFrom(
          this.http.get<RestaurantDto[]>(
            `${this.baseUrl}/api/restaurants?slot=Dinner&wifeApprovedOnly=false&take=10`,
          ),
        ),
      ]);

      // The demo layout pins specific restaurants into each section so the
      // mock visuals are reproducible from real seed data. Once the planner
      // can pick "closest to today's activity" we'll let it choose.
      const byName = (name: string) => (r: RestaurantDto) => r.name === name;
      const topPick = lunch.find(byName('La Marina'));
      const others = [
        lunch.find(byName('Symposium Café')),
        lunch.find(byName('The Sicilian Sidewalk Café')),
      ].filter((r): r is RestaurantDto => !!r);
      const sundayDinner = dinner.find(byName("Jack Astor's"));

      this._view.set({
        title: 'Saturday food',
        lede: PLACEHOLDER_VIEW.lede,
        filters: FILTERS,
        topPickSection: {
          title: 'Top pick for lunch',
          subtitle: 'Closest to Terre Bleu, kid-friendly menu',
          picks: topPick ? [toRestaurant(topPick)] : [],
        },
        otherPicks: {
          title: 'Other strong picks',
          picks: others.map(toRestaurant),
        },
        sundayDinner: {
          title: 'Sunday dinner',
          subtitle: 'After Rec Room — Square One area',
          picks: sundayDinner ? [toRestaurant(sundayDinner)] : [],
        },
      });
    } catch (err) {
      console.error('RestaurantService.load failed', err);
    }
  }
}
