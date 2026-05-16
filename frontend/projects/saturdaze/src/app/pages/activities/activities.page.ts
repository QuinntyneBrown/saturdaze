import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SdBottomNav, SdTopBar } from 'components';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [SdTopBar, SdBottomNav],
  templateUrl: './activities.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivitiesPage {}
