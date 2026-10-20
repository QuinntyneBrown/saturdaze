import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { addDaysIso, formatDayDate } from '../api/weekend-dates';
import { projectWeekend, withApiOrigin } from '../api/weekend-projection';
import { AdminFamiliesQuery, toAdminFamiliesParams } from '../models/admin/admin-families-query';
import {
  AdminFamilyDetailDto,
  AdminFamilyDto,
  AdminFamilyPageDto,
} from '../models/admin/admin-family.dto';
import { AdminFamiliesView, FamilyRow } from '../models/admin/family-row';
import {
  FamilyHeaderView,
  PastWeekendRow,
  WeekendChangeRow,
} from '../models/admin/family-weekend-view';
import {
  WeekendChangeAction,
  WeekendChangeDto,
  WeekendChangePageDto,
} from '../models/admin/weekend-change.dto';
import { ChipView } from '../models/chip-view';
import { WeekendDay } from '../models/weekend-day';
import { WeekendSummaryDto } from '../models/weekend-summary.dto';
import { WeekendDto } from '../models/weekend.dto';
import { WeekendView } from '../models/weekend-view';
import { utcWhen } from './admin-audit.service';
import { IAdminFamiliesService } from './admin-families.service.contract';

/** "4 members", "1 member". */
function members(n: number): string {
  return `${n} member${n === 1 ? '' : 's'}`;
}

/** "2 accounts", "1 account". */
function accounts(n: number): string {
  return `${n} account${n === 1 ? '' : 's'}`;
}

/** The Upcoming chips: planned with its block count (and how many are locked), or not planned (L2-157). */
export function upcomingChips(dto: AdminFamilyDto): ChipView[] {
  const u = dto.upcoming;
  if (!u) return [{ tone: 'neutral', label: 'Not planned' }];
  const chips: ChipView[] = [
    {
      tone: 'accent',
      icon: 'check',
      label: `Planned · ${u.blockCount} block${u.blockCount === 1 ? '' : 's'}`,
    },
  ];
  if (u.lockedCount > 0)
    chips.push({ tone: 'accent', icon: 'lock', label: `${u.lockedCount} locked` });
  return chips;
}

export function toFamilyRow(dto: AdminFamilyDto): FamilyRow {
  const meta = [members(dto.memberCount), accounts(dto.accounts.length)];
  if (dto.homeLocation) meta.push(dto.homeLocation);
  return {
    id: dto.id,
    name: dto.name,
    meta: meta.join(' · '),
    accounts: dto.accounts.join(' · '),
    flags: upcomingChips(dto),
    href: `/families/${dto.id}`,
  };
}

/** "17 – 18 May" for a Saturday ISO date. */
export function weekendSpan(saturdayIso: string): string {
  const sat = formatDayDate(saturdayIso);
  const sun = formatDayDate(addDaysIso(saturdayIso, 1));
  const [satDay, satMonth] = sat.split(' ');
  const [sunDay, sunMonth] = sun.split(' ');
  return satMonth === sunMonth ? `${satDay} – ${sunDay} ${satMonth}` : `${sat} – ${sun}`;
}

export function toFamilyHeader(dto: AdminFamilyDetailDto): FamilyHeaderView {
  const row = toFamilyRow(dto.family);
  const meta = [
    dto.family.homeLocation,
    members(dto.family.memberCount),
    accounts(dto.family.accounts.length),
  ]
    .filter((p) => p)
    .concat(`Weekend of ${weekendSpan(dto.upcomingWeekendOf)}`);
  return {
    id: dto.family.id,
    name: dto.family.name,
    meta: meta.join(' · '),
    upcomingWeekendOf: dto.upcomingWeekendOf,
    row,
  };
}

const ACTION_CHIP: Record<WeekendChangeAction, ChipView> = {
  plan: { tone: 'primary', label: 'Plan' },
  regenerate: { tone: 'primary', label: 'Regenerate' },
  regenerateDay: { tone: 'primary', label: 'Regenerate' },
  lockDay: { tone: 'accent', label: 'Lock' },
  unlockDay: { tone: 'neutral', label: 'Unlock' },
  lockBlock: { tone: 'accent', label: 'Lock' },
  unlockBlock: { tone: 'neutral', label: 'Unlock' },
  swap: { tone: 'sky', label: 'Swap' },
};

export function toChangeRow(dto: WeekendChangeDto): WeekendChangeRow {
  return {
    id: dto.id,
    time: utcWhen(dto.occurredAt),
    datetime: dto.occurredAt,
    who: dto.adminEmail,
    action: ACTION_CHIP[dto.action] ?? { tone: 'neutral', label: dto.action },
    summary: dto.summary,
  };
}

export function toPastRow(dto: WeekendSummaryDto): PastWeekendRow {
  const span = weekendSpan(dto.weekendOf);
  const parts = [...dto.activityHighlights];
  if (dto.rating) parts.push(`${dto.rating} of 5`);
  return {
    id: dto.id,
    title: dto.title ? `${span} · ${dto.title}` : span,
    subtitle: parts.length ? parts.join(' · ') : 'No activities planned',
    icon: dto.isFavourite ? 'star' : 'calendar',
    favourite: dto.isFavourite,
  };
}

const EMPTY: AdminFamiliesView = { status: 'loading', rows: [], total: 0, page: 1, pageSize: 50 };

/** HTTP implementation of `IAdminFamiliesService`. */
@Injectable({ providedIn: 'root' })
export class AdminFamiliesService implements IAdminFamiliesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly view = signal<AdminFamiliesView>(EMPTY);
  private readonly dto = signal<WeekendDto | null>(null);
  private readonly loaded = signal(false);
  private readonly weekendView = computed<WeekendView>(() => {
    if (!this.loaded()) return projectWeekend(null, 'loading');
    const dto = this.dto();
    return dto ? projectWeekend(dto) : projectWeekend(null, 'empty');
  });

  list(): Signal<AdminFamiliesView> {
    return this.view.asReadonly();
  }

  async load(query: AdminFamiliesQuery): Promise<void> {
    this.view.set({ ...EMPTY, status: 'loading' });
    const params = new HttpParams({ fromObject: toAdminFamiliesParams(query) });
    const page = await firstValueFrom(
      this.http.get<AdminFamilyPageDto>(`${this.baseUrl}/api/admin/families`, { params }),
    );
    const rows = page.items.map(toFamilyRow);
    this.view.set({
      status: rows.length ? 'ready' : 'empty',
      rows,
      total: page.total,
      page: page.page,
      pageSize: page.pageSize,
    });
  }

  async family(familyId: string): Promise<FamilyHeaderView> {
    const dto = await firstValueFrom(
      this.http.get<AdminFamilyDetailDto>(`${this.baseUrl}${this.route(familyId)}`),
    );
    return toFamilyHeader(dto);
  }

  weekend(): Signal<WeekendView> {
    return this.weekendView;
  }

  async loadWeekend(familyId: string): Promise<void> {
    this.loaded.set(false);
    try {
      const dto = await firstValueFrom(
        this.http.get<WeekendDto>(`${this.baseUrl}${this.route(familyId)}/weekends/current`),
      );
      this.apply(dto);
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        this.apply(null);
        return;
      }
      console.error('AdminFamiliesService.loadWeekend failed', err);
      throw err;
    }
  }

  plan(familyId: string): Promise<void> {
    return this.send(
      'plan',
      this.http.post<WeekendDto>(`${this.baseUrl}${this.route(familyId)}/weekends/plan`, {}),
    );
  }

  regenerate(familyId: string): Promise<void> {
    return this.send(
      'regenerate',
      this.http.post<WeekendDto>(
        `${this.baseUrl}${this.route(familyId)}/weekends/${this.weekendId()}/regenerate`,
        {},
      ),
    );
  }

  regenerateDay(familyId: string, day: WeekendDay): Promise<void> {
    return this.send(
      'regenerateDay',
      this.http.post<WeekendDto>(
        `${this.baseUrl}${this.route(familyId)}/weekends/${this.weekendId()}/days/${day.toLowerCase()}/regenerate`,
        {},
      ),
    );
  }

  lockDay(familyId: string, day: WeekendDay, locked: boolean): Promise<void> {
    return this.send(
      'lockDay',
      this.http.put<WeekendDto>(
        `${this.baseUrl}${this.route(familyId)}/weekends/${this.weekendId()}/days/${day.toLowerCase()}/lock`,
        { locked },
      ),
    );
  }

  lockBlock(familyId: string, blockId: string, locked: boolean): Promise<void> {
    return this.send(
      'lockBlock',
      this.http.put<WeekendDto>(
        `${this.baseUrl}${this.route(familyId)}/blocks/${encodeURIComponent(blockId)}/lock`,
        { locked },
      ),
    );
  }

  swapBlock(familyId: string, blockId: string): Promise<void> {
    return this.send(
      'swapBlock',
      this.http.post<WeekendDto>(
        `${this.baseUrl}${this.route(familyId)}/blocks/${encodeURIComponent(blockId)}/swap`,
        {},
      ),
    );
  }

  async history(familyId: string): Promise<readonly PastWeekendRow[]> {
    const items = await firstValueFrom(
      this.http.get<WeekendSummaryDto[]>(`${this.baseUrl}${this.route(familyId)}/weekends/history`),
    );
    return items.map(toPastRow);
  }

  async changes(familyId: string): Promise<readonly WeekendChangeRow[]> {
    const page = await firstValueFrom(
      this.http.get<WeekendChangePageDto>(`${this.baseUrl}${this.route(familyId)}/weekend-changes`),
    );
    return page.items.map(toChangeRow);
  }

  private route(familyId: string): string {
    return `/api/admin/families/${encodeURIComponent(familyId)}`;
  }

  private weekendId(): string {
    const id = this.dto()?.id;
    if (!id) throw new Error('No weekend is loaded for this family yet.');
    return id;
  }

  private async send(label: string, request: Observable<WeekendDto>): Promise<void> {
    try {
      this.apply(await firstValueFrom(request));
    } catch (err) {
      console.error(`AdminFamiliesService.${label} failed`, err);
      throw err;
    }
  }

  private apply(dto: WeekendDto | null): void {
    this.dto.set(dto ? withApiOrigin(dto, this.baseUrl) : null);
    this.loaded.set(true);
  }
}
