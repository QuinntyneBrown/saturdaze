import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Button, CopyField, Dialog as DialogShell } from 'components';

export interface ShareDialogData {
  readonly shareUrl: string;
}

/**
 * D5 — "Share this weekend": the read-only link with a Copy button.
 */
@Component({
  selector: 'app-share-dialog',
  standalone: true,
  imports: [Button, CopyField, DialogShell],
  templateUrl: './share-dialog.html',
  styleUrl: './share-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareDialog {
  private readonly dialogRef = inject<DialogRef<void>>(DialogRef);
  protected readonly data = inject<ShareDialogData>(DIALOG_DATA);

  protected done(): void {
    this.dialogRef.close();
  }
}
