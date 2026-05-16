import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SdBottomNav, SdTopBar } from 'components';

@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [SdTopBar, SdBottomNav],
  templateUrl: './restaurants.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantsPage {}
