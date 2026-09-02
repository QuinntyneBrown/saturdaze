import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { Button, Dialog as DialogShell, Stars } from 'components';

export interface RatingDialogData {
  /** "10 – 11 May · Bronte Creek + Rec Room". */
  readonly eyebrow: string;
  readonly rating: number | null;
}

export interface RatingDialogResult {
  readonly rating: number | null;
}

const CAPTIONS: Record<number, string> = {
  1: '1 of 5, skip it',
  2: '2 of 5, not again',
  3: '3 of 5, fine',
  4: '4 of 5, a good one',
  5: '5 of 5, a keeper',
};

/**
 * D13 — "How was it?": five star toggles. Pressing the active star clears
 * the rating.
 */
@Component({
  selector: 'app-rating-dialog',
  standalone: true,
  imports: [Button, DialogShell, Stars],
  templateUrl: './rating-dialog.html',
  styleUrl: './rating-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingDialog {
  private readonly dialogRef = inject<DialogRef<RatingDialogResult>>(DialogRef);
  protected readonly data = inject<RatingDialogData>(DIALOG_DATA);

  protected readonly rating = signal<number>(this.data.rating ?? 0);
  protected readonly caption = computed(() => CAPTIONS[this.rating()] ?? 'Tap a star to rate it.');

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected save(): void {
    this.dialogRef.close({ rating: this.rating() || null });
  }
}
