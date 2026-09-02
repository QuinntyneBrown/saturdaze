import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { FilterChip as FilterChipView, FoodCard as FoodCardView, FoodSection, MealSlot, RESTAURANT_SERVICE, WeekendDay } from 'api';
import { Banner, Chip, FilterChip, Filters, FoodCard, Icon, Section, StatusRow, Vote, VoteCell } from 'components';

import { DIALOG_OPTIONS } from '../../dialogs/confirm-dialog/confirm-dialog';
import {
  LockRestaurantDialog,
  LockRestaurantDialogData,
  LockRestaurantDialogResult,
} from '../../dialogs/lock-restaurant-dialog/lock-restaurant-dialog';
import { chipTone, filterTone } from '../../shared/chip-tones';

/**
 * Ideas · Food — `docs/mocks-v2/pages/ideas.food.html`: day, slot and extra
 * filters, then Lunch and Dinner sections of `sd-food-card`s with the
 * family vote row. Locking a pick (D12) puts it on the timeline and dims
 * the siblings.
 */
@Component({
  selector: 'app-ideas-food',
  standalone: true,
  imports: [Banner, Chip, FilterChip, Filters, FoodCard, Icon, Section, StatusRow],
  templateUrl: './ideas-food.page.html',
  styleUrl: './ideas-food.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdeasFoodPage {
  private readonly service = inject(RESTAURANT_SERVICE);
  private readonly dialog = inject(Dialog);

  protected readonly view = this.service.list();
  protected readonly error = signal('');
  protected readonly chipTone = chipTone;
  protected readonly filterTone = filterTone;

  constructor() {
    void this.service.load();
  }

  protected setDay(chip: FilterChipView): void {
    this.service.setFilters({ day: chip.label as WeekendDay });
  }

  protected setSlot(chip: FilterChipView): void {
    this.service.setFilters({ slot: chip.active ? null : (chip.label as MealSlot) });
  }

  protected setExtra(chip: FilterChipView): void {
    if (chip.label === 'Wife-approved') this.service.setFilters({ wifeApproved: !chip.active });
    else this.service.setFilters({ quick: !chip.active });
  }

  protected cells(card: FoodCardView): VoteCell[] {
    return card.votes.map((v) => ({ name: v.name, tone: v.tone, vote: v.vote }));
  }

  protected vote(card: FoodCardView, change: { index: number; vote: Vote }): Promise<void> {
    const voter = card.votes[change.index];
    if (!voter) return Promise.resolve();
    return this.run(() => this.service.vote(card.id, voter.name, change.vote));
  }

  protected async lockIn(section: FoodSection, card: FoodCardView): Promise<void> {
    const ref = this.dialog.open<LockRestaurantDialogResult, LockRestaurantDialogData>(
      LockRestaurantDialog,
      { ...DIALOG_OPTIONS, data: { card, day: section.day, slot: section.slot } },
    );
    const result = await firstValueFrom(ref.closed);
    if (result !== 'confirm') return;
    await this.run(() => this.service.lock(card.id, section.day, section.slot));
  }

  private async run(work: () => Promise<void>): Promise<void> {
    this.error.set('');
    try {
      await work();
    } catch (err) {
      this.error.set('That did not go through. Try again in a moment.');
      console.error('IdeasFoodPage action failed', err);
    }
  }
}
