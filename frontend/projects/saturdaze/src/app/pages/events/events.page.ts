import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SdBottomNav, SdTopBar } from 'components';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [SdTopBar, SdBottomNav],
  templateUrl: './events.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsPage {}
