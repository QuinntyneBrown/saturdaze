import { InjectionToken, Signal } from '@angular/core';

import { AdminFamiliesQuery } from '../models/admin/admin-families-query';
import { AdminFamiliesView } from '../models/admin/family-row';
import {
  FamilyHeaderView,
  PastWeekendRow,
  WeekendChangeRow,
} from '../models/admin/family-weekend-view';
import { WeekendDay } from '../models/weekend-day';
import { WeekendView } from '../models/weekend-view';

/**
 * Contract for Saturdaze Admin's family oversight (L2-157 → L2-161). Admin pages
 * inject `ADMIN_FAMILIES_SERVICE` and depend only on this interface. The weekend
 * reads and mutations keep one reactive view per family, like the family app's
 * `IWeekendPlanService`; mutations resolve once the server's weekend is applied.
 */
export interface IAdminFamiliesService {
  /** The Families screen's rows. */
  list(): Signal<AdminFamiliesView>;
  /** Load `GET /api/admin/families` for the query. */
  load(query: AdminFamiliesQuery): Promise<void>;

  /** `GET /api/admin/families/{id}`: the header of the Family weekend screen. */
  family(familyId: string): Promise<FamilyHeaderView>;
  /** The family's upcoming weekend as one signal; `empty` until planned. */
  weekend(): Signal<WeekendView>;
  /** `GET …/weekends/current`; a 404 `weekend_not_planned` resolves with the `empty` view. */
  loadWeekend(familyId: string): Promise<void>;
  /** `POST …/weekends/plan` (idempotent). */
  plan(familyId: string): Promise<void>;
  /** `POST …/weekends/{id}/regenerate`; locked blocks and commitments stay. */
  regenerate(familyId: string): Promise<void>;
  /** `POST …/weekends/{id}/days/{day}/regenerate`. */
  regenerateDay(familyId: string, day: WeekendDay): Promise<void>;
  /** `PUT …/weekends/{id}/days/{day}/lock`. */
  lockDay(familyId: string, day: WeekendDay, locked: boolean): Promise<void>;
  /** `PUT …/blocks/{blockId}/lock`. */
  lockBlock(familyId: string, blockId: string, locked: boolean): Promise<void>;
  /** `POST …/blocks/{blockId}/swap`. */
  swapBlock(familyId: string, blockId: string): Promise<void>;
  /** `GET …/weekends/history`: past weekends newest first. */
  history(familyId: string): Promise<readonly PastWeekendRow[]>;
  /** `GET …/weekend-changes`: administrator changes newest first. */
  changes(familyId: string): Promise<readonly WeekendChangeRow[]>;
}

export const ADMIN_FAMILIES_SERVICE = new InjectionToken<IAdminFamiliesService>(
  'ADMIN_FAMILIES_SERVICE',
);
