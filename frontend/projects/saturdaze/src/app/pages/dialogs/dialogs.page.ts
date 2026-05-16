import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SdBottomNav, SdTopBar } from 'components';

@Component({
  selector: 'app-dialogs',
  standalone: true,
  imports: [SdTopBar, SdBottomNav],
  templateUrl: './dialogs.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogsPage {}
