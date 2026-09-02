import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { SAVED_SERVICE, WEEKEND_PLAN_SERVICE, type SavedWeekend } from 'api';
import {
  BottomNav,
  Button,
  Chip,
  Empty,
  Icon,
  IconButton,
  ListItem,
  SavedCard,
  Section,
  TagGroup,
  TopBar,
} from 'components';
import {
  ProductActionDialog,
  ProductActionDialogResult,
} from '../../dialogs/product-action-dialog/product-action-dialog';
import {
  RatingDialog,
  RatingDialogData,
  RatingDialogResult,
} from '../../dialogs/rating-dialog/rating-dialog';

@Component({
  selector: 'app-saved',
  standalone: true,
  imports: [
    BottomNav,
    Button,
    Chip,
    Empty,
    Icon,
    IconButton,
    ListItem,
    RouterLink,
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
  private readonly dialog = inject(Dialog);
  private readonly saved = inject(SAVED_SERVICE);
  private readonly weekend = inject(WEEKEND_PLAN_SERVICE);
  private readonly router = inject(Router);

  protected readonly view = this.saved.list();
  protected readonly activeFilter = this.saved.activeFilter();
  protected readonly error = signal('');

  protected selectFilter(label: string): void {
    this.saved.setFilter(label);
  }

  protected openMore(): void {
    this.dialog.open(ProductActionDialog, {
      data: { kind: 'saved-more' },
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
  }

  /** Heart tap → `PUT /api/weekends/{id}/favourite` (L2-026). */
  protected async toggleFavourite(weekend: SavedWeekend, favourite: boolean): Promise<void> {
    this.error.set('');
    try {
      await this.saved.setFavourite(weekend.id, favourite);
    } catch {
      this.error.set("Couldn't update the favourite. Try again in a moment.");
    }
  }

  /** "Rate" → star sheet → rating + optional title persisted (L2-026). */
  protected async openRating(weekend: SavedWeekend): Promise<void> {
    const ref = this.dialog.open<RatingDialogResult, RatingDialogData>(RatingDialog, {
      data: {
        weekendTitle: weekend.title,
        rating: weekend.rating > 0 ? weekend.rating : null,
        title: weekend.customTitle,
      },
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    const result = await firstValueFrom(ref.closed);
    if (!result) return;

    this.error.set('');
    try {
      const currentRating = weekend.rating > 0 ? weekend.rating : null;
      if (result.rating !== currentRating) await this.saved.rate(weekend.id, result.rating);
      if (result.title !== weekend.customTitle) await this.saved.rename(weekend.id, result.title);
    } catch {
      this.error.set("Couldn't save the rating. Try again in a moment.");
    }
  }

  protected async remix(id: string, title: string): Promise<void> {
    const result = await this.openConfirm('remix', title);
    if (result !== 'confirm') return;
    await this.weekend.remixSaved(id);
    await this.router.navigateByUrl('/weekend');
  }

  protected async repeat(id: string, title: string): Promise<void> {
    const result = await this.openConfirm('repeat', title);
    if (result !== 'confirm') return;
    await this.weekend.repeatSaved(id);
    await this.router.navigateByUrl('/weekend');
  }

  private async openConfirm(kind: 'remix' | 'repeat', title: string): Promise<ProductActionDialogResult | undefined> {
    const ref = this.dialog.open<ProductActionDialogResult>(ProductActionDialog, {
      data: { kind, title },
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    return await firstValueFrom(ref.closed);
  }
}
