import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { WEEKEND_PLAN_SERVICE } from 'api';
import {
  BottomNav,
  Button,
  Chip,
  Icon,
  IconButton,
  Section,
  SplitView,
  TagGroup,
  TimelineBlock,
  TopBar,
} from 'components';

@Component({
  selector: 'app-itinerary',
  standalone: true,
  imports: [
    BottomNav,
    Button,
    Chip,
    Icon,
    IconButton,
    Section,
    SplitView,
    TagGroup,
    TimelineBlock,
    TopBar,
  ],
  templateUrl: './itinerary.page.html',
  styleUrl: './itinerary.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItineraryPage {
  protected readonly itinerary = inject(WEEKEND_PLAN_SERVICE).getItinerary();
}
