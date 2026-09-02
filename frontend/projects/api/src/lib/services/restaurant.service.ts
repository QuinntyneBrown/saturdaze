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
import { addDaysIso, upcomingSaturdayIso } from '../api/weekend-dates';
import { FamilyVote } from '../models/family-vote';
import { memberTone } from '../models/family-member-tone';
import { MealSlot } from '../models/meal-slot';
import { Restaurant } from '../models/restaurant';
import { RestaurantDto } from '../models/restaurant.dto';
import { RestaurantFilter } from '../models/restaurant-filter';
import { RestaurantSection } from '../models/restaurant-section';
import { RestaurantView } from '../models/restaurant-view';
import { Vote } from '../models/vote';
import { WeekendDay } from '../models/weekend-day';
import { FAMILY_SERVICE } from './family.service.contract';
import { IRestaurantService } from './restaurant.service.contract';

const LUNCH = 'Lunch';
const DINNER = 'Dinner';
const WIFE_APPROVED = 'Wife-approved only';
const QUICK = '< 15 min';

const FILTER_BASE: ReadonlyArray<RestaurantFilter> = [
  { label: LUNCH, tone: 'default' },
  { label: DINNER, tone: 'default' },
  { label: WIFE_APPROVED, tone: 'accent' },
  { label: QUICK, tone: 'sky' },
];

const DEFAULT_LEDE =
  'Family-approved styles first, closest to home. Lock a pick to settle the debate.';

/** A voter row: one per family member, oldest first. */
interface Voter {
  readonly name: string;
  readonly tone: FamilyVote['tone'];
}

/**
 * Votes for every family member. Members without a recorded vote show as
 * undecided (`none`) — nothing is invented.
 */
function votesFor(dto: RestaurantDto, roster: readonly Voter[]): FamilyVote[] {
  const serverVotes = new Map((dto.votes ?? []).map((v) => [v.voterName, v.vote]));
  const voters: Voter[] = roster.length > 0
    ? [...roster]
    : Array.from(serverVotes.keys()).map((name, i) => ({ name, tone: memberTone(i) }));
  return voters.map((v) => ({
    name: v.name,
    tone: v.tone,
    vote: serverVotes.get(v.name) ?? 'none',
  }));
}

/**
 * To Restaurant.
 */
function toRestaurant(dto: RestaurantDto, roster: readonly Voter[]): Restaurant {
  return {
    id: dto.id,
    name: dto.name,
    style: dto.style,
    near: dto.notes || undefined,
    drive: `${dto.driveMinutes} min`,
    wifeapproved: dto.wifeApproved,
    icon: 'fork',
    menuUrl: dto.menuUrl ?? menuUrlFor(dto.name),
    locked: dto.locked ?? false,
    votes: votesFor(dto, roster),
  };
}

/** Locked first, then approved, then closest. */
function rankPicks(rows: ReadonlyArray<RestaurantDto>): RestaurantDto[] {
  return [...rows].sort((a, b) =>
    Number(b.locked ?? false) - Number(a.locked ?? false)
    || Number(b.wifeApproved) - Number(a.wifeApproved)
    || a.driveMinutes - b.driveMinutes);
}

@Injectable({ providedIn: 'root' })
export class RestaurantService implements IRestaurantService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly family = inject(FAMILY_SERVICE);

  private readonly _lunch = signal<ReadonlyArray<RestaurantDto>>([]);
  private readonly _dinner = signal<ReadonlyArray<RestaurantDto>>([]);
  private readonly _filter = signal<string>(LUNCH);
  private readonly _lede = signal<string>(DEFAULT_LEDE);

  private readonly _roster = computed<Voter[]>(() => {
    const members = this.family.getEditableProfile()()?.members ?? [];
    return members.map((m, i) => ({ name: m.name, tone: memberTone(i) }));
  });

  private readonly _view = computed<RestaurantView>(() => {
    const filter = this._filter();
    const roster = this._roster();
    const lunch = rankPicks(this._lunch());
    const dinner = rankPicks(this._dinner());

    const showingDinner = filter === DINNER;
    let pool = showingDinner ? dinner : lunch;
    if (filter === WIFE_APPROVED) pool = pool.filter((r) => r.wifeApproved);
    if (filter === QUICK) pool = pool.filter((r) => r.driveMinutes < 15);

    const day: WeekendDay = showingDinner ? 'Sunday' : 'Saturday';
    const slot: MealSlot = showingDinner ? 'Dinner' : 'Lunch';
    const top = pool[0];
    const others = pool.slice(1, 4);
    const dinnerTop = dinner[0];

    const topPickSection: RestaurantSection = {
      title: `Top pick for ${slot.toLowerCase()}`,
      subtitle: top
        ? top.locked
          ? `Locked for ${day} ${slot.toLowerCase()}`
          : `${top.driveMinutes} min from home · ${top.style}`
        : 'No picks match this filter yet.',
      day,
      slot,
      picks: top ? [toRestaurant(top, roster)] : [],
    };

    return {
      title: `${day} food`,
      lede: this._lede(),
      filters: FILTER_BASE.map((f) => (f.label === filter ? { ...f, tone: 'primary' } : f)),
      topPickSection,
      otherPicks: {
        title: 'Other strong picks',
        day,
        slot,
        picks: others.map((r) => toRestaurant(r, roster)),
      },
      sundayDinner: {
        title: 'Sunday dinner',
        subtitle: dinnerTop
          ? dinnerTop.locked
            ? 'Locked for Sunday dinner'
            : `${dinnerTop.driveMinutes} min from home · ${dinnerTop.style}`
          : undefined,
        day: 'Sunday',
        slot: 'Dinner',
        picks: !showingDinner && dinnerTop ? [toRestaurant(dinnerTop, roster)] : [],
      },
    };
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
   * @returns {Signal<RestaurantView>} The result of the operation
   */
  list(): Signal<RestaurantView> {
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
   * Load — Saturday lunch and Sunday dinner for the upcoming weekend. The
   * full pool is fetched so the "Wife-approved only" chip has something to
   * narrow; approved picks still rank first.
   *
   * @returns {Promise<void>} The result of the operation
   */
  async load(): Promise<void> {
    const saturday = upcomingSaturdayIso();
    const sunday = addDaysIso(saturday, 1);
    try {
      const [lunch, dinner] = await Promise.all([
        firstValueFrom(this.http.get<RestaurantDto[]>(this.picksUrl(saturday, 'Lunch'))),
        firstValueFrom(this.http.get<RestaurantDto[]>(this.picksUrl(sunday, 'Dinner'))),
      ]);
      this._lunch.set(lunch ?? []);
      this._dinner.set(dinner ?? []);
    } catch (err) {
      console.error('RestaurantService.load failed', err);
    }
  }

  /**
   * Refresh — reload from the server; votes and locks are server-side so
   * they survive.
   *
   * @returns {Promise<void>} The result of the operation
   */
  async refresh(): Promise<void> {
    await this.load();
    this._lede.set('Fresh picks — your votes and locks are kept.');
  }

  /**
   * Vote.
   *
   * @param {string} restaurantId - The restaurant id
   * @param {string} voterName - The voter name
   * @param {Vote} vote - The vote
   *
   * @returns {Promise<void>} The result of the operation
   */
  async vote(restaurantId: string, voterName: string, vote: Vote): Promise<void> {
    try {
      const dto = await firstValueFrom(
        this.http.post<RestaurantDto>(`${this.baseUrl}/api/restaurants/${restaurantId}/vote`, {
          voterName,
          vote,
        }),
      );
      this.replaceRestaurant(dto);
      this._lede.set(`${voterName} voted on ${dto.name}.`);
    } catch (err) {
      console.error('RestaurantService.vote failed', err);
      throw err;
    }
  }

  /**
   * Lock.
   *
   * @param {string} restaurantId - The restaurant id
   * @param {WeekendDay} day - The day
   * @param {MealSlot} slot - The meal slot
   *
   * @returns {Promise<void>} The result of the operation
   */
  async lock(restaurantId: string, day: WeekendDay, slot: MealSlot): Promise<void> {
    try {
      const dto = await firstValueFrom(
        this.http.post<RestaurantDto>(`${this.baseUrl}/api/restaurants/${restaurantId}/lock`, {
          day,
          slot,
        }),
      );
      const relock = (rows: ReadonlyArray<RestaurantDto>) =>
        rows.map((r) => (r.id === dto.id ? { ...dto, locked: true } : { ...r, locked: false }));
      if (slot === 'Lunch') this._lunch.update(relock);
      else this._dinner.update(relock);
      this._lede.set(`${dto.name} is locked for ${day} ${slot.toLowerCase()}.`);
    } catch (err) {
      console.error('RestaurantService.lock failed', err);
      throw err;
    }
  }

  private picksUrl(dayIso: string, slot: MealSlot): string {
    return `${this.baseUrl}/api/restaurants?day=${dayIso}&slot=${slot}&wifeApprovedOnly=false&take=10`;
  }

  private replaceRestaurant(dto: RestaurantDto): void {
    const replace = (rows: ReadonlyArray<RestaurantDto>) =>
      rows.map((r) => (r.id === dto.id ? { ...dto, locked: dto.locked ?? r.locked } : r));
    this._lunch.update(replace);
    this._dinner.update(replace);
  }
}

/**
 * Menu Url For.
 *
 * @param {string} name - The name
 *
 * @returns {string} The result of the operation
 */
function menuUrlFor(name: string): string {
  const slug = encodeURIComponent(`${name} menu`);
  return `https://www.google.com/search?q=${slug}`;
}
