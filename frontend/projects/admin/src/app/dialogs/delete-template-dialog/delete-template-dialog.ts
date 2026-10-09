import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Button, Dialog as DialogShell, Icon, Well } from 'components';

export interface DeleteTemplateDialogData {
  readonly name: string;
  readonly key: string;
  /** Revisions that go with the template (its current version). */
  readonly versions: number;
}

export type DeleteTemplateDialogResult = 'delete';

/**
 * AD8 — Delete email template (docs/mocks/pages/dialogs.html#dialog-admin-delete-template).
 * Names the template and its history, and points at Archive as the way to
 * keep it (L2-129 AC7). Confirming closes with `delete`; the page sends it.
 */
@Component({
  selector: 'sd-admin-delete-template-dialog',
  standalone: true,
  imports: [Button, DialogShell, Icon, Well],
  templateUrl: './delete-template-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteTemplateDialog {
  private readonly dialogRef = inject<DialogRef<DeleteTemplateDialogResult>>(DialogRef);
  protected readonly data = inject<DeleteTemplateDialogData>(DIALOG_DATA);

  protected readonly title = `Delete "${this.data.name}"?`;
  protected readonly subtitle = `${this.data.key} and its ${this.data.versions} version${
    this.data.versions === 1 ? '' : 's'
  } are deleted. This cannot be undone.`;

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected confirm(): void {
    this.dialogRef.close('delete');
  }
}
