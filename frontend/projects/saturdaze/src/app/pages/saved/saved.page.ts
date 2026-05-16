import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { SavedService } from 'api';
import {
  SdBottomNav,
  SdButton,
  SdChip,
  SdIcon,
  SdIconButton,
  SdListItem,
  SdSavedCard,
  SdSection,
  SdTagGroup,
  SdTopBar,
} from 'components';

@Component({
  selector: 'app-saved',
  standalone: true,
  imports: [
    SdBottomNav,
    SdButton,
    SdChip,
    SdIcon,
    SdIconButton,
    SdListItem,
    SdSavedCard,
    SdSection,
    SdTagGroup,
    SdTopBar,
  ],
  templateUrl: './saved.page.html',
  styleUrl: './saved.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedPage {
  protected readonly view = inject(SavedService).list();
}
