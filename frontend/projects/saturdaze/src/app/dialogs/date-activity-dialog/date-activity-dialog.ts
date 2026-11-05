import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Button, Dialog as DialogShell, Icon, Well } from 'components';

export interface DateActivityDialogData {
  readonly activity: string;
  readonly detail: string;
  readonly meal: string;
}

export type DateActivityDialogResult = 'swap' | 'drop';

/** D40 — swap the date's activity for another nearby, or drop it (L2-223 AC3). */
@Component({
  selector: 'app-date-activity-dialog',
  standalone: true,
  imports: [Button, DialogShell, Icon, Well],
  templateUrl: './date-activity-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateActivityDialog {
  private readonly dialogRef = inject<DialogRef<DateActivityDialogResult>>(DialogRef);
  protected readonly data = inject<DateActivityDialogData>(DIALOG_DATA);

  protected close(result?: DateActivityDialogResult): void {
    this.dialogRef.close(result);
  }
}
