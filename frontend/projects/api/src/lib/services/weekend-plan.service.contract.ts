import { InjectionToken, Signal } from '@angular/core';

import { ItineraryView } from '../models/itinerary-view';
import { WeekendOverview } from '../models/weekend-overview';

export interface CalendarLinks {
  readonly icsUrl: string;
  readonly webcalUrl: string;
  readonly googleCalendarUrl: string;
}

export interface IWeekendPlanService {
  getOverview(): Signal<WeekendOverview>;
  getItinerary(): Signal<ItineraryView>;

  loadCurrent(): Promise<void>;
  plan(weekendOfIso: string): Promise<void>;
  regenerate(id?: string): Promise<void>;
  regenerateDay(day: 'Saturday' | 'Sunday', id?: string): Promise<void>;
  markFavourite(favourite: boolean, id?: string): Promise<void>;
  createShareLink(id?: string): Promise<string>;
  calendarLinks(id?: string): CalendarLinks;

  lockBlock(blockId: string, locked: boolean): Promise<void>;
  lockDay(day: 'Saturday' | 'Sunday', locked: boolean, id?: string): Promise<void>;
  swapBlock(blockId: string): Promise<void>;
  addErrand(
    description: string,
    estimatedMinutes: number,
    id?: string,
  ): Promise<void>;
  remixSaved(id: string): Promise<void>;
  repeatSaved(id: string): Promise<void>;

  setActiveDay(day: 'Saturday' | 'Sunday'): void;
}

export const WEEKEND_PLAN_SERVICE = new InjectionToken<IWeekendPlanService>(
  'WEEKEND_PLAN_SERVICE',
);
