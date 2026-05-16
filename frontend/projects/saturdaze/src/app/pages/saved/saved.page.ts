import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { SavedService } from 'api';
import {
  BottomNav,
  Button,
  Chip,
  Icon,
  IconButton,
  ListItem,
  SavedCard,
  Section,
  TagGroup,
  TopBar,
} from 'components';

@Component({
  selector: 'app-saved',
  standalone: true,
  imports: [
    BottomNav,
    Button,
    Chip,
    Icon,
    IconButton,
    ListItem,
    SavedCard,
    Section,
    TagGroup,
    TopBar,
  ],
  templateUrl: './saved.page.html',
  styleUrl: './saved.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedPage {
  protected readonly view = inject(SavedService).list();
}
