import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { FoodCard, MealSlot, WeekendDay } from 'api';
import { Button, Card, Chip, Dialog as DialogShell, Disc, Icon } from 'components';

import { chipTone } from '../../shared/chip-tones';

export interface LockRestaurantDialogData {
  readonly card: FoodCard;
  readonly day: WeekendDay;
  readonly slot: MealSlot;
}

export type LockRestaurantDialogResult = 'confirm';

/**
 * D12 — "Lock La Marina for Saturday lunch?".
 */
@Component({
  selector: 'app-lock-restaurant-dialog',
  standalone: true,
  imports: [Button, Card, Chip, DialogShell, Disc, Icon],
  templateUrl: './lock-restaurant-dialog.html',
  styleUrl: './lock-restaurant-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LockRestaurantDialog {
  private readonly dialogRef = inject<DialogRef<LockRestaurantDialogResult>>(DialogRef);
  protected readonly data = inject<LockRestaurantDialogData>(DIALOG_DATA);

  protected readonly title = `Lock ${this.data.card.name} for ${this.data.day} ${this.data.slot.toLowerCase()}?`;
  protected readonly chipTone = chipTone;

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected confirm(): void {
    this.dialogRef.close('confirm');
  }
}
