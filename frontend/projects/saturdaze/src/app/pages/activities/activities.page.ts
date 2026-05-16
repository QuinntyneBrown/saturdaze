import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ACTIVITY_SERVICE } from 'api';
import {
  ActivityCard,
  BottomNav,
  Chip,
  IconButton,
  Section,
  TagGroup,
  TopBar,
} from 'components';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [
    ActivityCard,
    BottomNav,
    Chip,
    IconButton,
    Section,
    TagGroup,
    TopBar,
  ],
  templateUrl: './activities.page.html',
  styleUrl: './activities.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivitiesPage {
  protected readonly view = inject(ACTIVITY_SERVICE).list();
}
