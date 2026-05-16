import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SdBottomNav, SdTopBar } from 'components';

@Component({
  selector: 'app-errand',
  standalone: true,
  imports: [SdTopBar, SdBottomNav],
  templateUrl: './errand.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrandPage {}
