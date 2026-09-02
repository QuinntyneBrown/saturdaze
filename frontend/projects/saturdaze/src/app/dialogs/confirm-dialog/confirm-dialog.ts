import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Button, Dialog as DialogShell, Icon } from 'components';

/**
 * Confirm Dialog Data.
 */
export interface ConfirmDialogData {
  /** Question, e.g. "Delete Mae?". */
  readonly title: string;
  /** Optional supporting line. */
  readonly body?: string;
  /** Defaults to "Confirm". */
  readonly confirmLabel?: string;
  /** Defaults to "Cancel". */
  readonly cancelLabel?: string;
  /** Destructive actions render the confirm button in the danger variant. */
  readonly danger?: boolean;
  /** Optional leading icon on the confirm button. */
  readonly icon?: string;
}

export type ConfirmDialogResult = 'confirm';

/**
 * The one confirmation sheet. Replaces `window.confirm` everywhere so every
 * modal goes through the CDK overlay (focus trap, ESC, backdrop).
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [Button, DialogShell, Icon],
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

/**
 * Open a confirmation and resolve `true` only when the user confirmed.
 */
export async function confirmWith(dialog: Dialog, data: ConfirmDialogData): Promise<boolean> {
  const ref = dialog.open<ConfirmDialogResult, ConfirmDialogData>(ConfirmDialog, {
    data,
    autoFocus: 'first-tabbable',
    restoreFocus: true,
  });
  return (await firstValueFrom(ref.closed)) === 'confirm';
}
