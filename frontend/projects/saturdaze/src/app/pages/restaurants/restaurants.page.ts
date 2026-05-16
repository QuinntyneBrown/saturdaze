import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { RestaurantService } from 'api';
import {
  BottomNav,
  Button,
  Chip,
  Icon,
  IconButton,
  RestaurantCard,
  Section,
  TagGroup,
  TopBar,
  VoteRow,
} from 'components';

@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [
    BottomNav,
    Button,
    Chip,
    Icon,
    IconButton,
    RestaurantCard,
    Section,
    TagGroup,
    TopBar,
    VoteRow,
  ],
  templateUrl: './restaurants.page.html',
  styleUrl: './restaurants.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantsPage {
  protected readonly view = inject(RestaurantService).list();
}
