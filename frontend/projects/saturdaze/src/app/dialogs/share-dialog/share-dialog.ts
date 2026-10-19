import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { Banner, Button, CopyField, Dialog as DialogShell } from 'components';

export interface ShareDialogData {
  readonly shareUrl: string;
  /** "Stop sharing" — retires every link to the weekend (L2-086 AC6). */
  readonly stopSharing: () => Promise<void>;
}

/**
 * D5 — "Share this weekend": the read-only link with a Copy button, and Stop
 * sharing to retire it.
 */
@Component({
  selector: 'app-share-dialog',
  standalone: true,
  imports: [Banner, Button, CopyField, DialogShell],
  templateUrl: './share-dialog.html',
  styleUrl: './share-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareDialog {
  private readonly dialogRef = inject<DialogRef<void>>(DialogRef);
  protected readonly data = inject<ShareDialogData>(DIALOG_DATA);

  protected readonly stopping = signal(false);
  protected readonly error = signal('');

  protected done(): void {
    this.dialogRef.close();
  }

  protected async stop(): Promise<void> {
    this.stopping.set(true);
    this.error.set('');
    try {
      await this.data.stopSharing();
      this.dialogRef.close();
    } catch {
      this.error.set('Could not stop sharing. Try again.');
    } finally {
      this.stopping.set(false);
    }
  }
}
