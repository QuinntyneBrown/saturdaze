import { InjectionToken, Signal } from '@angular/core';

import { EventsView } from '../models/events-view';

export interface IEventsService {
  list(): Signal<EventsView>;
  load(weekendOfIso?: string): Promise<void>;
}

export const EVENTS_SERVICE = new InjectionToken<IEventsService>(
  'EVENTS_SERVICE',
);
