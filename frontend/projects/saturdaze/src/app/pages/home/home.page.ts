import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SdBottomNav, SdTopBar } from 'components';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SdTopBar, SdBottomNav],
  templateUrl: './home.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}
