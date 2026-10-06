import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { placementFor } from '../api/errand-placement';
import { calendarFileName } from '../api/weekend-dates';
import { projectWeekend, withApiOrigin } from '../api/weekend-projection';
import { CalendarExport } from '../models/calendar-export';
import { ErrandPlacement } from '../models/errand-placement';
import { WeekendDay } from '../models/weekend-day';
import { WeekendDto } from '../models/weekend.dto';
import { WeekendView } from '../models/weekend-view';
import { IWeekendPlanService } from './weekend-plan.service.contract';
import { CoverSelection } from '../models/cover-view';
import { IdeaPlacementDto } from '../models/idea-placement.dto';
import { IdeaPlacementView } from '../models/idea-placement-view';
import { IdeaRequest } from '../models/idea-request';
import { hhmm } from '../api/format';

/**
 * Weekend Share Dto — `POST /api/weekends/{id}/share`.
 */
interface WeekendShareDto {
  /**
   * Share Url.
   */
  readonly shareUrl: string;
  /**
   * Token.
   */
  readonly token: string;
}

@Injectable({ providedIn: 'root' })
export class WeekendPlanService implements IWeekendPlanService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _dto = signal<WeekendDto | null>(null);
  private readonly _loaded = signal(false);

  private readonly _view = computed<WeekendView>(() => {
    if (!this._loaded()) return projectWeekend(null, 'loading');
    const dto = this._dto();
    return dto ? projectWeekend(dto) : projectWeekend(null, 'empty');
  });

  /**
   * Get Weekend.
   *
   * @returns {Signal<WeekendView>} The result of the operation
   */
  getWeekend(): Signal<WeekendView> {
    return this._view;
  }

  /**
   * Load Current — a 404 means nothing has been planned yet.
   *
   * @returns {Promise<void>} The result of the operation
   */
  async loadCurrent(): Promise<void> {
    try {
      const dto = await firstValueFrom(
        this.http.get<WeekendDto>(`${this.baseUrl}/api/weekends/current`),
      );
      this.apply(dto);
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        this.apply(null);
        return;
      }
      console.error('WeekendPlanService.loadCurrent failed', err);
      throw err;
    }
  }

  /**
   * Plan.
   *
   * @param {string} weekendOfIso - The Saturday, `YYYY-MM-DD`
   *
   * @returns {Promise<void>} The result of the operation
   */
  async plan(weekendOfIso: string): Promise<void> {
    await this.send(
      'plan',
      this.http.post<WeekendDto>(`${this.baseUrl}/api/weekends/plan`, { weekendOf: weekendOfIso }),
    );
  }

  /**
   * Regenerate.
   *
   * @param {string} id - The weekend id (defaults to the current one)
   *
   * @returns {Promise<void>} The result of the operation
   */
  async regenerate(id?: string): Promise<void> {
    const target = this.targetId(id);
    await this.send(
      'regenerate',
      this.http.post<WeekendDto>(`${this.baseUrl}/api/weekends/${target}/regenerate`, {}),
    );
  }

  /**
   * Regenerate Day.
   *
   * @param {WeekendDay} day - The day
   * @param {string} id - The weekend id (defaults to the current one)
   *
   * @returns {Promise<void>} The result of the operation
   */
  async regenerateDay(day: WeekendDay, id?: string): Promise<void> {
    const target = this.targetId(id);
    await this.send(
      'regenerateDay',
      this.http.post<WeekendDto>(
        `${this.baseUrl}/api/weekends/${target}/days/${day.toLowerCase()}/regenerate`,
        {},
      ),
    );
  }

  /**
   * Create Share Link.
   *
   * @param {string} id - The weekend id (defaults to the current one)
   *
   * @returns {Promise<string>} The read-only share URL
   */
  async createShareLink(id?: string): Promise<string> {
    const target = this.targetId(id);
    try {
      const dto = await firstValueFrom(
        this.http.post<WeekendShareDto>(`${this.baseUrl}/api/weekends/${target}/share`, {}),
      );
      return dto.shareUrl;
    } catch (err) {
      console.error('WeekendPlanService.createShareLink failed', err);
      throw err;
    }
  }

  /**
   * Calendar Export.
   *
   * @param {string} id - The weekend id (defaults to the current one)
   *
   * @returns {CalendarExport} The result of the operation
   */
  calendarExport(id?: string): CalendarExport {
    const target = this.targetId(id);
    const dto = this._dto();
    const current = dto && dto.id === target ? dto : null;
    return {
      icsUrl: `${this.baseUrl}/api/weekends/${target}/calendar.ics`,
      fileName: current ? calendarFileName(current.weekendOf) : 'weekend.ics',
      eventCount: current ? current.blocks.length : 0,
    };
  }

  /**
   * Lock Block.
   *
   * @param {string} blockId - The block id
   * @param {boolean} locked - The locked
   *
   * @returns {Promise<void>} The result of the operation
   */
  async lockBlock(blockId: string, locked: boolean): Promise<void> {
    await this.send(
      'lockBlock',
      this.http.put<WeekendDto>(`${this.baseUrl}/api/blocks/${blockId}/lock`, { locked }),
    );
  }

  /**
   * Swap Block.
   *
   * @param {string} blockId - The block id
   * @param {readonly string[]} rejectedActivityIds - Activities to exclude
   *
   * @returns {Promise<void>} The result of the operation
   */
  async swapBlock(blockId: string, rejectedActivityIds: readonly string[] = []): Promise<void> {
    await this.send(
      'swapBlock',
      this.http.post<WeekendDto>(`${this.baseUrl}/api/blocks/${blockId}/swap`, {
        rejectedActivityIds: [...rejectedActivityIds],
      }),
    );
  }

  /**
   * Lock Day.
   *
   * @param {WeekendDay} day - The day
   * @param {boolean} locked - The locked
   * @param {string} id - The weekend id (defaults to the current one)
   *
   * @returns {Promise<void>} The result of the operation
   */
  async lockDay(day: WeekendDay, locked: boolean, id?: string): Promise<void> {
    const target = this.targetId(id);
    await this.send(
      'lockDay',
      this.http.put<WeekendDto>(
        `${this.baseUrl}/api/weekends/${target}/days/${day.toLowerCase()}/lock`,
        { locked },
      ),
    );
  }

  /**
   * Add Errand — resolves with where the planner put it.
   *
   * @param {string} description - The description
   * @param {number} estimatedMinutes - The estimated minutes
   * @param {WeekendDay | null} preferredDay - The preferred day
   *
   * @returns {Promise<ErrandPlacement | null>} The result of the operation
   */
  async addErrand(
    description: string,
    estimatedMinutes: number,
    preferredDay: WeekendDay | null = null,
  ): Promise<ErrandPlacement | null> {
    const target = this.targetId();
    const before = this._dto();
    const dto = await this.send(
      'addErrand',
      this.http.post<WeekendDto>(`${this.baseUrl}/api/weekends/${target}/errands`, {
        description,
        estimatedMinutes,
        preferredDay,
      }),
    );
    return placementFor(before, dto, description);
  }

  /**
   * Set Errand Done.
   *
   * @param {string} errandId - The errand id
   * @param {boolean} done - The done flag
   *
   * @returns {Promise<void>} The result of the operation
   */
  async setErrandDone(errandId: string, done: boolean): Promise<void> {
    await this.send(
      'setErrandDone',
      this.http.put<WeekendDto>(`${this.baseUrl}/api/errands/${errandId}/done`, { done }),
    );
  }

  /**
   * Remix Saved.
   *
   * @param {string} id - The saved weekend id
   *
   * @returns {Promise<void>} The result of the operation
   */
  async remixSaved(id: string): Promise<void> {
    await this.send(
      'remixSaved',
      this.http.post<WeekendDto>(`${this.baseUrl}/api/weekends/${id}/remix`, {}),
    );
  }

  /**
   * Repeat Saved.
   *
   * @param {string} id - The saved weekend id
   *
   * @returns {Promise<void>} The result of the operation
   */
  async repeatSaved(id: string): Promise<void> {
    await this.send(
      'repeatSaved',
      this.http.post<WeekendDto>(`${this.baseUrl}/api/weekends/${id}/repeat`, {}),
    );
  }

  /**
   * Preview Idea — the placement for D27 (L2-095). Loads the current weekend
   * first when the family opened Ideas before Weekend.
   *
   * @param {IdeaRequest} request - Which idea, day and timing
   *
   * @returns {Promise<IdeaPlacementView>} The preview
   */
  async previewIdea(request: IdeaRequest): Promise<IdeaPlacementView> {
    const target = await this.currentId();
    const dto = await firstValueFrom(
      this.http.post<IdeaPlacementDto>(
        `${this.baseUrl}/api/weekends/${target}/ideas/preview`,
        request,
      ),
    );
    return placementView(dto);
  }

  /**
   * Add Idea — `POST /api/weekends/{id}/ideas`; the returned weekend replaces
   * the cached one, so the Weekend screen shows the block without a reload.
   *
   * @param {IdeaRequest} request - Which idea, day and timing
   *
   * @returns {Promise<void>} The result of the operation
   */
  async addIdea(request: IdeaRequest): Promise<void> {
    const target = await this.currentId();
    await this.send(
      'addIdea',
      this.http.post<WeekendDto>(`${this.baseUrl}/api/weekends/${target}/ideas`, request),
    );
  }

  /**
   * Set Cover — the default rule or a stop's photo (L2-096 AC2).
   *
   * @param {CoverSelection} selection - The default rule or a stop
   *
   * @returns {Promise<void>} The result of the operation
   */
  async setCover(selection: CoverSelection): Promise<void> {
    await this.send(
      'setCover',
      this.http.put<WeekendDto>(`${this.baseUrl}/api/weekends/${this.targetId()}/cover`, selection),
    );
  }

  async uploadCover(file: Blob): Promise<void> {
    const form = new FormData();
    form.append('file', file);
    await this.send(
      'uploadCover',
      this.http.post<WeekendDto>(`${this.baseUrl}/api/weekends/${this.targetId()}/cover`, form),
    );
  }

  /** The current weekend's id, loading it when nothing is cached yet. */
  private async currentId(): Promise<string> {
    if (!this._dto()) await this.loadCurrent();
    return this.targetId();
  }

  /**
   * Send — run one mutation, apply the weekend it returns, rethrow on failure.
   */
  private async send(label: string, request: Observable<WeekendDto>): Promise<WeekendDto> {
    try {
      const dto = await firstValueFrom(request);
      this.apply(dto);
      return dto;
    } catch (err) {
      console.error(`WeekendPlanService.${label} failed`, err);
      throw err;
    }
  }

  /**
   * Apply.
   */
  private apply(dto: WeekendDto | null): void {
    this._dto.set(dto ? withApiOrigin(dto, this.baseUrl) : null);
    this._loaded.set(true);
  }

  /**
   * Target Id.
   */
  private targetId(id?: string): string {
    const target = id ?? this._dto()?.id;
    if (!target) throw new Error('No current weekend is loaded yet.');
    return target;
  }
}

/** "Saturday · 15:00 to 17:00" + what it replaces, or why it does not fit (L2-095). */
function placementView(dto: IdeaPlacementDto): IdeaPlacementView {
  if (!dto.fits) {
    return {
      fits: false,
      title: `No room on ${dto.day}`,
      body: dto.reason ?? 'There is no slot long enough on that day.',
    };
  }
  const replaced = dto.replacedBlockTitles;
  return {
    fits: true,
    title: `${dto.day} · ${hhmm(dto.startTime)} to ${hhmm(dto.endTime)}`,
    body: replaced.length
      ? `Replaces ${replaced.join(', ')}.`
      : 'Fits into free time; nothing else moves.',
  };
}
