import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { FamilyService } from 'api';
import {
  SdAvatar,
  SdBottomNav,
  SdCard,
  SdChip,
  SdIcon,
  SdIconButton,
  SdListItem,
  SdSection,
  SdTagGroup,
  SdToggle,
  SdTopBar,
} from 'components';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    SdAvatar,
    SdBottomNav,
    SdCard,
    SdChip,
    SdIcon,
    SdIconButton,
    SdListItem,
    SdSection,
    SdTagGroup,
    SdToggle,
    SdTopBar,
  ],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  protected readonly profile = inject(FamilyService).getProfile();
}
