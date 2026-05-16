import { EventFilter } from './event-filter';
import { EventSection } from './event-section';

export interface EventsView {
  readonly heading: string;
  readonly lede: string;
  readonly filters: readonly EventFilter[];
  readonly sections: readonly EventSection[];
}
