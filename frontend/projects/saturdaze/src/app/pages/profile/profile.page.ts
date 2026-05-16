import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { FamilyService } from 'api';
import {
  Avatar,
  BottomNav,
  Card,
  Chip,
  Icon,
  IconButton,
  ListItem,
  Section,
  TagGroup,
  Toggle,
  TopBar,
} from 'components';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    Avatar,
    BottomNav,
    Card,
    Chip,
    Icon,
    IconButton,
    ListItem,
    Section,
    TagGroup,
    Toggle,
    TopBar,
  ],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  protected readonly profile = inject(FamilyService).getProfile();
}
