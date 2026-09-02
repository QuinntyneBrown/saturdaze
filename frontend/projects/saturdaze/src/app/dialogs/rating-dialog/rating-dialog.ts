import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Button, Dialog as DialogShell, Icon } from 'components';

/**
 * Rating Dialog Data.
 */
export interface RatingDialogData {
  /** The weekend as it is currently titled (custom or derived). */
  readonly weekendTitle: string;
  /** Current 1..5 rating, `null` when unrated. */
  readonly rating: number | null;
  /** Current custom title, `null` when the card shows a derived one. */
  readonly title: string | null;
}

/**
 * Rating Dialog Result.
 */
export interface RatingDialogResult {
  /** 1..5, or `null` to clear the rating. */
  readonly rating: number | null;
  /** Trimmed custom title, or `null` to fall back to the derived one. */
  readonly title: string | null;
}

const STARS = [1, 2, 3, 4, 5] as const;

/**
 * Rate a saved weekend (L2-026) and optionally name it. Five toggle
 * buttons carry `aria-pressed`; pressing the active star clears it.
 */
@Component({
  selector: 'app-rating-dialog',
  standalone: true,
  imports: [Button, DialogShell, FormsModule, Icon],
  templateUrl: './rating-dialog.html',
  styleUrl: './rating-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingDialog {
  private readonly dialogRef = inject<DialogRef<RatingDialogResult>>(DialogRef);
  protected readonly data = inject<RatingDialogData>(DIALOG_DATA);

  protected readonly stars = STARS;
  protected readonly rating = signal<number | null>(this.data.rating ?? null);
  protected readonly title = signal<string>(this.data.title ?? '');

  protected readonly ratingLabel = computed(() => {
    const r = this.rating();
    if (r === null) return 'Not rated yet';
    return `${r} of 5 stars`;
  });

  protected pick(star: number): void {
    this.rating.set(this.rating() === star ? null : star);
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected save(): void {
    const title = this.title().trim();
    this.dialogRef.close({
      rating: this.rating(),
      title: title.length > 0 ? title : null,
    });
  }
}
