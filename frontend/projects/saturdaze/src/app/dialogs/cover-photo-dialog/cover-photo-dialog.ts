import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { CoverChoice, CoverSelection } from 'api';
import { Button, Dialog as DialogShell, Icon } from 'components';

export interface CoverPhotoDialogData {
  readonly choices: readonly CoverChoice[];
  /** The place whose photo is the cover now, if any. */
  readonly currentPlaceId: string | null;
}

export type CoverPhotoDialogResult = CoverSelection;

/**
 * D28 — "Cover photo" (L2-096 AC2): every stop's photo as a radio tile; the
 * chosen one becomes the cover on the Weekend screen, in Past and on the shared
 * link.
 */
@Component({
  selector: 'app-cover-photo-dialog',
  standalone: true,
  imports: [Button, DialogShell, Icon],
  templateUrl: './cover-photo-dialog.html',
  styleUrl: './cover-photo-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverPhotoDialog {
  private readonly dialogRef = inject<DialogRef<CoverPhotoDialogResult>>(DialogRef);
  protected readonly data = inject<CoverPhotoDialogData>(DIALOG_DATA);
  protected readonly selected = signal<string | null>(
    this.data.currentPlaceId ?? this.data.choices[0]?.placeId ?? null,
  );

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected use(): void {
    const placeId = this.selected();
    if (placeId) this.dialogRef.close({ source: 'stop', placeId });
  }
}
