import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { EventsService } from 'api';
import {
  SdBottomNav,
  SdChip,
  SdEventCard,
  SdSection,
  SdTagGroup,
  SdTopBar,
} from 'components';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [
    SdBottomNav,
    SdChip,
    SdEventCard,
    SdSection,
    SdTagGroup,
    SdTopBar,
  ],
  templateUrl: './events.page.html',
  styleUrl: './events.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsPage {
  protected readonly view = inject(EventsService).list();
}
