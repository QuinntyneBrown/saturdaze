import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MediaView } from 'api';
import { Button, Dialog as DialogShell, Icon, Media, TextInput } from 'components';

export interface RejectPhotoDialogData {
  /** The provider photo (null when its URL is blocked). */
  readonly media: MediaView | null;
  readonly placeName: string;
}

export interface RejectPhotoDialogResult {
  /** The administrator's note, trimmed; empty when none. */
  readonly reason: string;
}

/**
 * AD6 — Reject provider photo (docs/mocks/pages/dialogs.html#dialog-admin-reject).
 * The photo is deleted and its address remembered so ingestion never adds it
 * for the place again; the reason is optional (L2-120 AC4).
 */
@Component({
  selector: 'sd-admin-reject-photo-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, Button, DialogShell, Icon, Media, TextInput],
  templateUrl: './reject-photo-dialog.html',
  styleUrl: './reject-photo-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RejectPhotoDialog {
  private readonly dialogRef = inject<DialogRef<RejectPhotoDialogResult>>(DialogRef);
  protected readonly data = inject<RejectPhotoDialogData>(DIALOG_DATA);

  protected readonly subtitle = `It is deleted and ingestion never adds this address for ${this.data.placeName} again.`;
  protected readonly reason = new FormControl('', { nonNullable: true });

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected reject(): void {
    this.dialogRef.close({ reason: this.reason.value.trim() });
  }
}
