import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Button, CopyField, Dialog as DialogShell } from 'components';

export interface InviteLinkDialogData {
  readonly name: string;
  readonly email: string;
  /** The accept-invite link the owner shares (L2-126). */
  readonly url: string;
}

/**
 * D30 — "Invite ready": the single-use accept-invite link with a Copy
 * button. The link is only shown here; it cannot be recovered later.
 */
@Component({
  selector: 'app-invite-link-dialog',
  standalone: true,
  imports: [Button, CopyField, DialogShell],
  templateUrl: './invite-link-dialog.html',
  styleUrl: './invite-link-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteLinkDialog {
  private readonly dialogRef = inject<DialogRef<void>>(DialogRef);
  protected readonly data = inject<InviteLinkDialogData>(DIALOG_DATA);

  protected done(): void {
    this.dialogRef.close();
  }
}
