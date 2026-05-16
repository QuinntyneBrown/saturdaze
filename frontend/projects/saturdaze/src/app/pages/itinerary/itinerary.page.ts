import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { WeekendPlanService } from 'api';
import {
  SdBottomNav,
  SdButton,
  SdChip,
  SdIcon,
  SdIconButton,
  SdSection,
  SdSplitView,
  SdTagGroup,
  SdTimelineBlock,
  SdTopBar,
} from 'components';

@Component({
  selector: 'app-itinerary',
  standalone: true,
  imports: [
    SdBottomNav,
    SdButton,
    SdChip,
    SdIcon,
    SdIconButton,
    SdSection,
    SdSplitView,
    SdTagGroup,
    SdTimelineBlock,
    SdTopBar,
  ],
  templateUrl: './itinerary.page.html',
  styleUrl: './itinerary.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItineraryPage {
  protected readonly itinerary = inject(WeekendPlanService).getDemoItinerary();
}
