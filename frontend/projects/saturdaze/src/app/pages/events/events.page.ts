import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { EVENTS_SERVICE } from 'api';
import {
  BottomNav,
  Chip,
  EventCard,
  Section,
  TagGroup,
  TopBar,
} from 'components';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [
    BottomNav,
    Chip,
    EventCard,
    Section,
    TagGroup,
    TopBar,
  ],
  templateUrl: './events.page.html',
  styleUrl: './events.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsPage {
  protected readonly view = inject(EVENTS_SERVICE).list();
}
