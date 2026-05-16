import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ActivityService } from 'api';
import {
  SdActivityCard,
  SdBottomNav,
  SdChip,
  SdIconButton,
  SdSection,
  SdTagGroup,
  SdTopBar,
} from 'components';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [
    SdActivityCard,
    SdBottomNav,
    SdChip,
    SdIconButton,
    SdSection,
    SdTagGroup,
    SdTopBar,
  ],
  templateUrl: './activities.page.html',
  styleUrl: './activities.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivitiesPage {
  protected readonly view = inject(ActivityService).list();
}
