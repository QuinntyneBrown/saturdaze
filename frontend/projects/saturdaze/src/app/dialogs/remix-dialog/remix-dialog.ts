import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { RemixPreviewRow } from 'api';
import { Button, Chip, Dialog as DialogShell, Icon, List, ListItem } from 'components';

export interface RemixDialogData {
  /** The saved weekend's stops, marked Keep or New (L2-084 AC5). */
  readonly rows: readonly RemixPreviewRow[];
}

export type RemixDialogResult = 'remix';

/**
 * D16 — "Remix this weekend?": previews which stops are re-picked and which
 * stay, before the remix replaces the current draft.
 */
@Component({
  selector: 'app-remix-dialog',
  standalone: true,
  imports: [Button, Chip, DialogShell, Icon, List, ListItem],
  templateUrl: './remix-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemixDialog {
  private readonly dialogRef = inject<DialogRef<RemixDialogResult>>(DialogRef);
  protected readonly rows = inject<RemixDialogData>(DIALOG_DATA).rows;

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected remix(): void {
    this.dialogRef.close('remix');
  }
}
