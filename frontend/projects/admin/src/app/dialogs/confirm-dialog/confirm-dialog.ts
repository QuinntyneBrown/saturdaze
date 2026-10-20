import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Button, Dialog as DialogShell, Icon, Well, WellTone } from 'components';

import { DIALOG_OPTIONS } from '../dialog-options';

export interface ConfirmDialogData {
  /** Question, e.g. "Regenerate the Browns' weekend?". */
  readonly title: string;
  /** Supporting line under the title. */
  readonly body?: string;
  /** Optional note block in the body ("Keeping: Swim 9:00am · …"). */
  readonly well?: {
    readonly icon?: string;
    readonly title?: string;
    readonly body: string;
    readonly tone?: WellTone;
  };
  /** Defaults to "Confirm". */
  readonly confirmLabel?: string;
  /** Optional leading icon on the confirm button. */
  readonly icon?: string;
}

export type ConfirmDialogResult = 'confirm';

/**
 * AD7 — the admin confirmation (docs/mocks/pages/dialogs.html#dialog-admin-regenerate):
 * a question, what is kept, Cancel and the action (L2-160).
 */
@Component({
  selector: 'sd-admin-confirm-dialog',
  standalone: true,
  imports: [Button, DialogShell, Icon, Well],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  private readonly dialogRef = inject<DialogRef<ConfirmDialogResult>>(DialogRef);
  protected readonly data = inject<ConfirmDialogData>(DIALOG_DATA);

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected confirm(): void {
    this.dialogRef.close('confirm');
  }
}

/** Open a confirmation and resolve `true` only when the administrator confirmed. */
export async function confirmWith(dialog: Dialog, data: ConfirmDialogData): Promise<boolean> {
  const ref = dialog.open<ConfirmDialogResult, ConfirmDialogData>(ConfirmDialog, {
    ...DIALOG_OPTIONS,
    data,
  });
  return (await firstValueFrom(ref.closed)) === 'confirm';
}
