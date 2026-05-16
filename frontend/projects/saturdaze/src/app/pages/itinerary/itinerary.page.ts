import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SdBottomNav, SdTopBar } from 'components';

@Component({
  selector: 'app-itinerary',
  standalone: true,
  imports: [SdTopBar, SdBottomNav],
  templateUrl: './itinerary.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItineraryPage {}
