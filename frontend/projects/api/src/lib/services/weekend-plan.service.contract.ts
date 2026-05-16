import { InjectionToken, Signal } from '@angular/core';

import { ItineraryView } from '../models/itinerary-view';
import { WeekendOverview } from '../models/weekend-overview';

export interface IWeekendPlanService {
  getOverview(): Signal<WeekendOverview>;
  getItinerary(): Signal<ItineraryView>;

  loadCurrent(): Promise<void>;
  plan(weekendOfIso: string): Promise<void>;
  regenerate(id?: string): Promise<void>;
  markFavourite(favourite: boolean, id?: string): Promise<void>;

  lockBlock(blockId: string, locked: boolean): Promise<void>;
  swapBlock(blockId: string): Promise<void>;
  addErrand(
    description: string,
    estimatedMinutes: number,
    id?: string,
  ): Promise<void>;

  setActiveDay(day: 'Saturday' | 'Sunday'): void;
}

export const WEEKEND_PLAN_SERVICE = new InjectionToken<IWeekendPlanService>(
  'WEEKEND_PLAN_SERVICE',
);
