import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { CalendarLinks } from 'api';

import {
  Button,
  Card,
  Chip,
  Dialog as DialogShell,
  Icon,
  ListItem,
} from 'components';

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
  readonly day?: 'Saturday' | 'Sunday';
  readonly title?: string;
  readonly subtitle?: string;
  readonly restaurant?: string;
  readonly shareUrl?: string;
  readonly saturdayHighlight?: string;
  readonly sundayHighlight?: string;
  readonly calendarLinks?: CalendarLinks;
}

export type ProductActionDialogResult = 'confirm' | 'copy';

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
  protected readonly copied = signal(false);

  protected close(): void {
    this.dialogRef.close();
  }

  protected confirm(): void {
    this.dialogRef.close('confirm');
  }

  protected async copyShareLink(): Promise<void> {
    await navigator.clipboard?.writeText(this.data.shareUrl ?? '');
    this.copied.set(true);
    this.dialogRef.close('copy');
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
