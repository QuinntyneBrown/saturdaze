import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { Activity, Block, CalendarLinks, MealSlot, WeekendDay } from 'api';

import {
  Button,
  Card,
  Chip,
  Dialog as DialogShell,
  Icon,
  ListItem,
} from 'components';

import { mapsSearchUrl } from '../../shared/block-actions';

export type ProductActionKind =
  | 'calendar'
  | 'share'
  | 'regenerate-weekend'
  | 'regenerate-day'
  | 'map'
  | 'surprise'
  | 'remix'
  | 'repeat'
  | 'itinerary-more'
  | 'saved-more'
  | 'restaurant-lock';

export interface ProductActionDialogData {
  readonly kind: ProductActionKind;
  readonly day?: WeekendDay;
  readonly slot?: MealSlot;
  readonly title?: string;
  readonly subtitle?: string;
  readonly restaurant?: string;
  readonly shareUrl?: string;
  readonly saturdayHighlight?: string;
  readonly sundayHighlight?: string;
  readonly calendarLinks?: CalendarLinks;
  /** `map`: the active day's blocks, in order. */
  readonly blocks?: readonly Block[];
  /** `surprise`: the "Try something new" picks. */
  readonly activities?: readonly Activity[];
}

export type ProductActionDialogResult = 'confirm';

@Component({
  selector: 'app-product-action-dialog',
  standalone: true,
  imports: [
    Button,
    Card,
    Chip,
    DialogShell,
    Icon,
    ListItem,
  ],
  templateUrl: './product-action-dialog.html',
  styleUrl: './product-action-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductActionDialog {
  private readonly dialogRef = inject<DialogRef<ProductActionDialogResult>>(DialogRef);
  protected readonly data = inject<ProductActionDialogData>(DIALOG_DATA);

  /** Blocks worth a map pin: everything except downtime and the drives between. */
  protected readonly stops: readonly Block[] = (this.data.blocks ?? []).filter(
    (b) => b.kind !== 'Downtime' && b.kind !== 'Drive',
  );

  protected readonly mapSubtitle = this.stops.length > 0
    ? `${this.stops.length} stop${this.stops.length === 1 ? '' : 's'} · opens the first activity in Google Maps`
    : 'Nothing planned for this day yet.';

  /** The place the "Open in Google Maps" button searches for. */
  protected readonly mapQuery: string | null =
    this.stops.find((b) => b.kind === 'Activity')?.title
    ?? this.stops.find((b) => b.kind === 'Meal')?.title
    ?? null;

  protected readonly mapsUrl: string | null = this.mapQuery ? mapsSearchUrl(this.mapQuery) : null;

  protected readonly lockTitle = `Lock ${this.data.restaurant ?? 'this restaurant'} for ${this.data.day ?? 'Saturday'} ${(this.data.slot ?? 'Lunch').toLowerCase()}?`;

  protected close(): void {
    this.dialogRef.close();
  }

  protected confirm(): void {
    this.dialogRef.close('confirm');
  }

  protected async copyShareLink(): Promise<void> {
    await navigator.clipboard?.writeText(this.data.shareUrl ?? '');
    this.dialogRef.close();
  }

  protected async shareNative(): Promise<void> {
    const url = this.data.shareUrl;
    if (url && 'share' in navigator) {
      await navigator.share({
        title: 'Saturdaze weekend',
        text: this.shareMessage(),
        url,
      });
    }
    this.dialogRef.close('confirm');
  }

  /**
   * One-line preview built from the current weekend's Saturday + Sunday
   * highlights. Mirrors the message that lands in the recipient's share
   * sheet so the dialog preview and the actual send say the same thing.
   */
  protected shareMessage(): string {
    const sat = this.data.saturdayHighlight?.trim();
    const sun = this.data.sundayHighlight?.trim();
    if (sat && sun) return `Here's the weekend — ${sat} Saturday, ${sun} Sunday.`;
    if (sat) return `Here's the weekend — ${sat} Saturday.`;
    if (sun) return `Here's the weekend — ${sun} Sunday.`;
    return "Here's the weekend.";
  }
}
