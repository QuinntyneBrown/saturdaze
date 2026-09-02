import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { EVENTS_SERVICE, EventsWindow, FilterChip as FilterChipView } from 'api';
import { Chip, EventCard, FilterChip, Filters, Icon, Section, StatusRow } from 'components';

import { chipTone, filterTone } from '../../shared/chip-tones';

/**
 * Ideas · Events — `docs/mocks-v2/pages/ideas.events.html`: window and
 * category chips, then "Your suggestion" (pending, muted), Saturday,
 * Sunday and "Coming soon". Cards link out to the event page.
 */
@Component({
  selector: 'app-ideas-events',
  standalone: true,
  imports: [Chip, EventCard, FilterChip, Filters, Icon, Section, StatusRow],
  templateUrl: './ideas-events.page.html',
  styleUrl: './ideas-events.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdeasEventsPage {
  private readonly service = inject(EVENTS_SERVICE);

  protected readonly view = this.service.list();
  protected readonly chipTone = chipTone;
  protected readonly filterTone = filterTone;

  constructor() {
    void this.service.load();
  }

  protected setWindow(chip: FilterChipView): void {
    this.service.setWindow(chip.label as EventsWindow);
  }

  protected setCategory(chip: FilterChipView): void {
    this.service.setCategory(chip.active ? null : chip.label);
  }
}
