import {
  Injectable,
  Signal,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import {
  FamilyVote,
  Restaurant,
  RestaurantView,
  VoterTone,
} from '../models/restaurant';

interface RestaurantDto {
  readonly id: string;
  readonly name: string;
  readonly style: string;
  readonly slot: 'Lunch' | 'Dinner';
  readonly wifeApproved: boolean;
  readonly driveMinutes: number;
  readonly notes: string;
}

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

function voteFor(restaurantName: string, voter: { name: string }): 'up' | 'down' | 'none' {
  // Stable hash so the same restaurant + voter pair always shows the same vote.
  const key = `${restaurantName}::${voter.name}`;
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const bucket = ((h % 5) + 5) % 5;
  if (bucket === 4) return 'down';
  if (bucket === 3) return 'none';
  return 'up';
}

function synthVotes(restaurantName: string): ReadonlyArray<FamilyVote> {
  return VOTER_ROSTER.map((v) => ({
    name: v.name,
    tone: v.tone,
    vote: voteFor(restaurantName, v),
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
export class RestaurantService {
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

      // Mock layout: "Top pick" = top-ranked Lunch pick (La Marina).
      // "Other picks" = next two Lunch picks. "Sunday dinner" = top-ranked Dinner pick.
      const lunchSorted = [...lunch].sort((a, b) => {
        if (a.name === 'La Marina') return -1;
        if (b.name === 'La Marina') return 1;
        if (a.wifeApproved !== b.wifeApproved) return a.wifeApproved ? -1 : 1;
        return a.driveMinutes - b.driveMinutes;
      });
      const topPick = lunchSorted[0];
      const others = lunchSorted.slice(1, 3);

      const dinnerSorted = [...dinner].sort((a, b) => {
        if (a.name === "Jack Astor's") return -1;
        if (b.name === "Jack Astor's") return 1;
        if (a.wifeApproved !== b.wifeApproved) return a.wifeApproved ? -1 : 1;
        return a.driveMinutes - b.driveMinutes;
      });
      const sundayDinner = dinnerSorted[0];

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
