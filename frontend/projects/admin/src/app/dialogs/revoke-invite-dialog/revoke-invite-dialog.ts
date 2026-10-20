import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Button, Dialog as DialogShell, Icon } from 'components';

export interface RevokeInviteDialogData {
  readonly email: string;
}

export type RevokeInviteDialogResult = 'revoke';

/**
 * AD8 — Revoke an invite (docs/mocks/pages/dialogs.html#dialog-admin-revoke):
 * names the address whose link stops working (L2-158 AC5).
 */
@Component({
  selector: 'sd-admin-revoke-invite-dialog',
  standalone: true,
  imports: [Button, DialogShell, Icon],
  templateUrl: './revoke-invite-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevokeInviteDialog {
  private readonly dialogRef = inject<DialogRef<RevokeInviteDialogResult>>(DialogRef);
  protected readonly data = inject<RevokeInviteDialogData>(DIALOG_DATA);

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected revoke(): void {
    this.dialogRef.close('revoke');
  }
}
