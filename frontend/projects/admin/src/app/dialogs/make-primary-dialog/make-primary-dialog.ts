import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { MediaView } from 'api';
import { Button, Dialog as DialogShell, Icon, Media, Well } from 'components';

export interface MakePrimaryDialogData {
  /** The photo about to become primary (null when its URL is blocked). */
  readonly media: MediaView | null;
  readonly placeName: string;
  /** Weekends whose chosen cover follows this place (L2-114 AC3). */
  readonly coverImpact: number;
}

export type MakePrimaryDialogResult = 'confirm';

/** "5 weekend covers will change" · "1 weekend cover will change" · the none line (L2-117 AC2). */
export function coverImpactWarning(coverImpact: number): string {
  if (coverImpact === 0) return 'No weekend covers follow this place';
  return coverImpact === 1
    ? '1 weekend cover will change'
    : `${coverImpact} weekend covers will change`;
}

/**
 * AD4 — Make primary (docs/mocks/pages/dialogs.html#dialog-admin-primary).
 * Shows the photo and how many weekend covers follow the place before the
 * administrator confirms (L2-117 AC2).
 */
@Component({
  selector: 'sd-admin-make-primary-dialog',
  standalone: true,
  imports: [Button, DialogShell, Icon, Media, Well],
  templateUrl: './make-primary-dialog.html',
  styleUrl: './make-primary-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MakePrimaryDialog {
  private readonly dialogRef = inject<DialogRef<MakePrimaryDialogResult>>(DialogRef);
  protected readonly data = inject<MakePrimaryDialogData>(DIALOG_DATA);

  protected readonly subtitle = computed(
    () => `${this.data.placeName} · the photo on every idea card and cover.`,
  );
  protected readonly warning = computed(() => coverImpactWarning(this.data.coverImpact));
  protected readonly warningBody = computed(() =>
    this.data.coverImpact === 0
      ? 'Idea cards show the new primary on their next load.'
      : 'Weekends whose cover follows this place show the new primary on their next load, in Past and on shared links too.',
  );

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected confirm(): void {
    this.dialogRef.close('confirm');
  }
}
