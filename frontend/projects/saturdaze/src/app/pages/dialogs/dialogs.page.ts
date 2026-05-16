import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  SdAvatar,
  SdButton,
  SdCard,
  SdChip,
  SdDialog,
  SdIcon,
  SdListItem,
  SdTextInput,
  SdToggle,
  SdVoteRow,
} from 'components';

@Component({
  selector: 'app-dialogs',
  standalone: true,
  imports: [
    SdAvatar,
    SdButton,
    SdCard,
    SdChip,
    SdDialog,
    SdIcon,
    SdListItem,
    SdTextInput,
    SdToggle,
    SdVoteRow,
  ],
  templateUrl: './dialogs.page.html',
  styleUrl: './dialogs.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogsPage {}
