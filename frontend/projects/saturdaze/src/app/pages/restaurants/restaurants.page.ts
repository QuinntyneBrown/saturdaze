import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { RESTAURANT_SERVICE, type Vote } from 'api';
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
import {
  ProductActionDialog,
  ProductActionDialogResult,
} from '../../dialogs/product-action-dialog/product-action-dialog';

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
  private readonly restaurants = inject(RESTAURANT_SERVICE);
  private readonly dialog = inject(Dialog);

  protected readonly view = this.restaurants.list();
  protected readonly refreshing = signal(false);

  protected async refreshPicks(): Promise<void> {
    if (this.refreshing()) return;
    this.refreshing.set(true);
    try {
      await this.restaurants.refresh();
    } finally {
      this.refreshing.set(false);
    }
  }

  protected vote(restaurantId: string | undefined, voterName: string, vote: Vote): void {
    if (!restaurantId) return;
    void this.restaurants.vote(restaurantId, voterName, vote);
  }

  protected async lockRestaurant(restaurantId: string | undefined, restaurantName: string): Promise<void> {
    if (!restaurantId) return;
    const ref = this.dialog.open<ProductActionDialogResult>(ProductActionDialog, {
      data: { kind: 'restaurant-lock', restaurant: restaurantName },
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    const result = await firstValueFrom(ref.closed);
    if (result === 'confirm') await this.restaurants.lock(restaurantId);
  }
}
