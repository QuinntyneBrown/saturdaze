import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Button, Dialog as DialogShell, Menu, MenuItem } from 'components';

export interface MenuDialogData {
  readonly title: string;
  readonly items: readonly MenuItem[];
}

/**
 * The phone-width bottom sheet for a short action menu (D25 "Weekend
 * options", the account menu). Closes with the chosen item.
 */
@Component({
  selector: 'app-menu-dialog',
  standalone: true,
  imports: [Button, DialogShell, Menu],
  templateUrl: './menu-dialog.html',
  styleUrl: './menu-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuDialog {
  private readonly dialogRef = inject<DialogRef<MenuItem | undefined>>(DialogRef);
  protected readonly data = inject<MenuDialogData>(DIALOG_DATA);

  protected pick(item: MenuItem): void {
    this.dialogRef.close(item);
  }

  protected close(): void {
    this.dialogRef.close();
  }
}
