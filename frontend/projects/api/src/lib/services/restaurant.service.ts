import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { initialOf, toMinutes } from '../api/format';
import { addDaysIso, upcomingSaturdayIso } from '../api/weekend-dates';
import { BlockRow } from '../models/block-row';
import { ChipView } from '../models/chip-view';
import { FamilyVote } from '../models/family-vote';
import { memberTone } from '../models/family-member-tone';
import { FilterChip } from '../models/filter-chip';
import { FoodCard } from '../models/food-card';
import { FoodFilters } from '../models/food-filters';
import { FoodSection } from '../models/food-section';
import { IdeasFoodView } from '../models/ideas-food-view';
import { MealSlot } from '../models/meal-slot';
import { RestaurantDto } from '../models/restaurant.dto';
import { Vote } from '../models/vote';
import { WeekendDay } from '../models/weekend-day';
import { WeekendView } from '../models/weekend-view';
import { FAMILY_SERVICE } from './family.service.contract';
import { IRestaurantService } from './restaurant.service.contract';
import { WEEKEND_PLAN_SERVICE } from './weekend-plan.service.contract';

const SUBTITLE = 'Places to eat near what you are already doing.';
const CLOSE_TO_HOME = 'Close to home';
const WIFE_APPROVED = 'Wife-approved';
const QUICK = 'Under 15 min';
const QUICK_MINUTES = 15;

const DAYS: readonly WeekendDay[] = ['Saturday', 'Sunday'];
const SLOTS: readonly MealSlot[] = ['Lunch', 'Dinner'];

/** Meal blocks starting in this window belong to lunch; later ones to dinner. */
const LUNCH_FROM = 10 * 60;
const LUNCH_UNTIL = 15 * 60;

export const DEFAULT_FOOD_FILTERS: FoodFilters = {
  day: 'Saturday',
  slot: null,
  wifeApproved: false,
  quick: false,
};

type ListKey = `${WeekendDay}:${MealSlot}`;
type Lists = Readonly<Record<ListKey, ReadonlyArray<RestaurantDto>>>;

const EMPTY_LISTS: Lists = {
  'Saturday:Lunch': [],
  'Saturday:Dinner': [],
  'Sunday:Lunch': [],
  'Sunday:Dinner': [],
};

/** A voter row: one per family member, oldest first. */
interface Voter {
  readonly name: string;
  readonly tone: FamilyVote['tone'];
}

function keyOf(day: WeekendDay, slot: MealSlot): ListKey {
  return `${day}:${slot}`;
}

/**
 * Votes for every family member. Members without a recorded vote show as
 * undecided (`none`) — nothing is invented.
 */
function votesFor(dto: RestaurantDto, roster: readonly Voter[]): FamilyVote[] {
  const serverVotes = new Map((dto.votes ?? []).map((v) => [v.voterName, v.vote]));
  const voters: Voter[] =
    roster.length > 0
      ? [...roster]
      : Array.from(serverVotes.keys()).map((name, i) => ({ name, tone: memberTone(i) }));
  return voters.map((v) => ({
    name: v.name,
    initial: initialOf(v.name),
    tone: v.tone,
    vote: serverVotes.get(v.name) ?? 'none',
  }));
}

/** "Mediterranean · Patio · 3 of 4 votes". */
function metaFor(dto: RestaurantDto, votes: readonly FamilyVote[]): string {
  const parts = [dto.style];
  if (dto.notes?.trim()) parts.push(dto.notes.trim());
  const cast = votes.filter((v) => v.vote !== 'none').length;
  if (cast > 0) {
    const up = votes.filter((v) => v.vote === 'up').length;
    parts.push(`${up} of ${votes.length} votes`);
  }
  return parts.join(' · ');
}

/**
 * To Card.
 */
function toCard(
  dto: RestaurantDto,
  roster: readonly Voter[],
  slot: MealSlot,
  ctx: { topPick: boolean; lockedId: string | null },
): FoodCard {
  const votes = votesFor(dto, roster);
  const locked = dto.id === ctx.lockedId;
  const dimmed = ctx.lockedId !== null && !locked;
  const chips: ChipView[] = [];
  if (dto.wifeApproved) chips.push({ tone: 'accent', icon: 'heart', label: WIFE_APPROVED });
  chips.push({ tone: 'sky', icon: 'car', label: `${dto.driveMinutes} min` });
  return {
    id: dto.id,
    name: dto.name,
    meta: metaFor(dto, votes),
    chips,
    votes,
    menuUrl: dto.menuUrl || null,
    topPick: ctx.topPick,
    locked,
    lockedLabel: locked ? `Locked for ${slot.toLowerCase()}` : null,
    dimmed,
    votesDisabled: dimmed,
  };
}

/** Locked first, then approved, then closest. */
function rankPicks(rows: ReadonlyArray<RestaurantDto>): RestaurantDto[] {
  return [...rows].sort(
    (a, b) =>
      Number(b.locked ?? false) - Number(a.locked ?? false) ||
      Number(b.wifeApproved) - Number(a.wifeApproved) ||
      a.driveMinutes - b.driveMinutes,
  );
}

/** Which meal a Meal block on the timeline stands for. */
function slotOf(block: BlockRow): MealSlot | null {
  const start = toMinutes(block.time);
  if (start >= LUNCH_FROM && start < LUNCH_UNTIL) return 'Lunch';
  if (start >= LUNCH_UNTIL) return 'Dinner';
  return null;
}

/**
 * "Near Terre Bleu · 12:00 to 1:30pm" when the weekend already has a meal
 * block for the day and slot, else "Close to home".
 */
function sectionSubtitle(weekend: WeekendView, day: WeekendDay, slot: MealSlot): string {
  const rows = weekend.days.find((d) => d.day === day)?.blocks ?? [];
  const index = rows.findIndex((b) => b.kind === 'Meal' && slotOf(b) === slot);
  if (index === -1) return CLOSE_TO_HOME;
  const meal = rows[index]!;
  const activity = rows
    .slice(0, index)
    .reverse()
    .find((b) => b.kind === 'Activity');
  return activity
    ? `Near ${activity.title} · ${meal.timeRange}`
    : `${CLOSE_TO_HOME} · ${meal.timeRange}`;
}

/**
 * Build Section — rank, narrow by the toggles, mark the top pick and the
 * lock, dim the rest.
 */
function buildSection(
  day: WeekendDay,
  slot: MealSlot,
  rows: ReadonlyArray<RestaurantDto>,
  filters: FoodFilters,
  roster: readonly Voter[],
  weekend: WeekendView,
): FoodSection {
  let pool = rankPicks(rows);
  if (filters.wifeApproved) pool = pool.filter((r) => r.wifeApproved);
  if (filters.quick) pool = pool.filter((r) => r.driveMinutes < QUICK_MINUTES);
  const lockedId = pool.find((r) => r.locked)?.id ?? null;
  return {
    title: slot,
    subtitle: sectionSubtitle(weekend, day, slot),
    day,
    slot,
    lockedId,
    picks: pool.map((r, i) =>
      toCard(r, roster, slot, { topPick: i === 0 && lockedId === null, lockedId }),
    ),
  };
}

@Injectable({ providedIn: 'root' })
export class RestaurantService implements IRestaurantService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly family = inject(FAMILY_SERVICE);
  private readonly weekend = inject(WEEKEND_PLAN_SERVICE);

  private readonly _lists = signal<Lists>(EMPTY_LISTS);
  private readonly _filters = signal<FoodFilters>(DEFAULT_FOOD_FILTERS);

  private readonly _roster = computed<Voter[]>(() => {
    const members = this.family.getEditableProfile()()?.members ?? [];
    return members.map((m, i) => ({ name: m.name, tone: memberTone(i) }));
  });

  private readonly _view = computed<IdeasFoodView>(() => {
    const filters = this._filters();
    const lists = this._lists();
    const roster = this._roster();
    const weekend = this.weekend.getWeekend()();
    const slots = filters.slot ? [filters.slot] : SLOTS;

    const dayChips: FilterChip[] = DAYS.map((d) => ({
      label: d,
      tone: 'default',
      active: filters.day === d,
    }));
    const slotChips: FilterChip[] = SLOTS.map((s) => ({
      label: s,
      tone: 'default',
      active: filters.slot === s,
    }));
    const extraChips: FilterChip[] = [
      { label: WIFE_APPROVED, tone: 'accent', icon: 'heart', active: filters.wifeApproved },
      { label: QUICK, tone: 'default', active: filters.quick },
    ];

    return {
      subtitle: SUBTITLE,
      dayChips,
      slotChips,
      extraChips,
      sections: slots.map((slot) =>
        buildSection(filters.day, slot, lists[keyOf(filters.day, slot)], filters, roster, weekend),
      ),
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
   * @returns {Signal<IdeasFoodView>} The result of the operation
   */
  list(): Signal<IdeasFoodView> {
    return this._view;
  }

  /**
   * Set Filters.
   *
   * @param {Partial<FoodFilters>} patch - The fields to change
   */
  setFilters(patch: Partial<FoodFilters>): void {
    this._filters.update((current) => ({ ...current, ...patch }));
  }

  /**
   * Load — the four lists in parallel; a failed list is simply empty.
   *
   * @returns {Promise<void>} The result of the operation
   */
  async load(): Promise<void> {
    // The section subtitles read the current weekend's meal blocks; make sure
    // it is loaded once when Food is the first page opened.
    if (this.weekend.getWeekend()().status === 'loading') {
      await this.weekend.loadCurrent().catch(() => undefined);
    }
    const saturday = upcomingSaturdayIso();
    const sunday = addDaysIso(saturday, 1);
    const fetch = (dayIso: string, slot: MealSlot): Promise<ReadonlyArray<RestaurantDto>> =>
      firstValueFrom(this.http.get<RestaurantDto[]>(this.picksUrl(dayIso, slot)))
        .then((rows) => rows ?? [])
        .catch((err: unknown) => {
          console.error(`RestaurantService.load failed for ${dayIso} ${slot}`, err);
          return [];
        });
    const [satLunch, satDinner, sunLunch, sunDinner] = await Promise.all([
      fetch(saturday, 'Lunch'),
      fetch(saturday, 'Dinner'),
      fetch(sunday, 'Lunch'),
      fetch(sunday, 'Dinner'),
    ]);
    this._lists.set({
      'Saturday:Lunch': satLunch,
      'Saturday:Dinner': satDinner,
      'Sunday:Lunch': sunLunch,
      'Sunday:Dinner': sunDinner,
    });
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
      const key = keyOf(day, slot);
      this._lists.update((lists) => ({
        ...lists,
        [key]: lists[key].map((r) =>
          r.id === dto.id ? { ...dto, locked: true } : { ...r, locked: false },
        ),
      }));
    } catch (err) {
      console.error('RestaurantService.lock failed', err);
      throw err;
    }
  }

  private picksUrl(dayIso: string, slot: MealSlot): string {
    return `${this.baseUrl}/api/restaurants?day=${dayIso}&slot=${slot}&wifeApprovedOnly=false&take=10`;
  }

  private replaceRestaurant(dto: RestaurantDto): void {
    this._lists.update((lists) => {
      const next: Record<ListKey, ReadonlyArray<RestaurantDto>> = { ...lists };
      for (const day of DAYS) {
        for (const slot of SLOTS) {
          const key = keyOf(day, slot);
          next[key] = lists[key].map((r) =>
            r.id === dto.id ? { ...dto, locked: dto.locked ?? r.locked } : r,
          );
        }
      }
      return next;
    });
  }
}
