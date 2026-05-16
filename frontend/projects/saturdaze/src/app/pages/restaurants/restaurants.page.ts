import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { RestaurantService } from 'api';
import {
  SdBottomNav,
  SdButton,
  SdChip,
  SdIcon,
  SdIconButton,
  SdRestaurantCard,
  SdSection,
  SdTagGroup,
  SdTopBar,
  SdVoteRow,
} from 'components';

@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [
    SdBottomNav,
    SdButton,
    SdChip,
    SdIcon,
    SdIconButton,
    SdRestaurantCard,
    SdSection,
    SdTagGroup,
    SdTopBar,
    SdVoteRow,
  ],
  templateUrl: './restaurants.page.html',
  styleUrl: './restaurants.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantsPage {
  protected readonly view = inject(RestaurantService).list();
}
