import { LocalEvent } from './local-event';

export interface EventSection {
  readonly title: string;
  readonly events: readonly LocalEvent[];
}
