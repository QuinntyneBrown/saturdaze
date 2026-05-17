import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Button, Card, Dialog as DialogShell, Icon } from 'components';

export interface SignOutDialogData {
  readonly email: string;
}

export type SignOutDialogResult = 'confirm';

@Component({
  selector: 'app-sign-out-dialog',
  standalone: true,
  imports: [Button, Card, DialogShell, Icon],
  templateUrl: './sign-out-dialog.html',
  styleUrl: './sign-out-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignOutDialog {
  private readonly dialogRef = inject<DialogRef<SignOutDialogResult>>(DialogRef);
  protected readonly data = inject<SignOutDialogData>(DIALOG_DATA);

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected confirm(): void {
    this.dialogRef.close('confirm');
  }
}
