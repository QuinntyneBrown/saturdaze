import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Button, Dialog as DialogShell, Icon, Well, WellTone } from 'components';

/**
 * Confirm Dialog Data.
 */
export interface ConfirmDialogData {
  /** Question, e.g. "Regenerate the weekend?". */
  readonly title: string;
  /** Supporting line under the title. */
  readonly body?: string;
  /** Optional note block in the body ("Keeping: Swim 9:00 · …"). */
  readonly well?: {
    readonly icon?: string;
    readonly title?: string;
    readonly body: string;
    readonly tone?: WellTone;
  };
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
 * The one confirmation dialog (D3, D4, D15, D16, D21, D22). Replaces
 * `window.confirm` everywhere so every modal goes through the CDK overlay
 * (focus trap, ESC, backdrop).
 */
@Component({
  selector: 'app-confirm-dialog',
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

/** The options every app dialog opens with. */
export const DIALOG_OPTIONS = {
  autoFocus: 'first-tabbable' as const,
  restoreFocus: true,
  panelClass: 'sd-dialog-panel',
  backdropClass: 'sd-dialog-backdrop',
};

/**
 * Open a confirmation and resolve `true` only when the user confirmed.
 */
export async function confirmWith(dialog: Dialog, data: ConfirmDialogData): Promise<boolean> {
  const ref = dialog.open<ConfirmDialogResult, ConfirmDialogData>(ConfirmDialog, {
    data,
    ...DIALOG_OPTIONS,
  });
  return (await firstValueFrom(ref.closed)) === 'confirm';
}
