import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  SdBottomNav,
  SdButton,
  SdCard,
  SdChip,
  SdIcon,
  SdTagGroup,
  SdTextInput,
  SdTopBar,
} from 'components';

@Component({
  selector: 'app-errand',
  standalone: true,
  imports: [
    SdBottomNav,
    SdButton,
    SdCard,
    SdChip,
    SdIcon,
    SdTagGroup,
    SdTextInput,
    SdTopBar,
  ],
  templateUrl: './errand.page.html',
  styleUrl: './errand.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrandPage {}
