import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SdBottomNav, SdTopBar } from 'components';

@Component({
  selector: 'app-saved',
  standalone: true,
  imports: [SdTopBar, SdBottomNav],
  templateUrl: './saved.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedPage {}
