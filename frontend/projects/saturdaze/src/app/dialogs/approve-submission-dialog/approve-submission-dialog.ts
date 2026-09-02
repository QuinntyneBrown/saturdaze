import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { EventSubmissionDto, formatWhen } from 'api';
import { Button, Card, Dialog as DialogShell, Icon } from 'components';

export interface ApproveSubmissionDialogData {
  readonly submission: EventSubmissionDto;
}

export type ApproveSubmissionDialogResult = 'approve' | undefined;

@Component({
  selector: 'app-approve-submission-dialog',
  standalone: true,
  imports: [Button, Card, DialogShell, Icon],
  templateUrl: './approve-submission-dialog.html',
  styleUrl: './approve-submission-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApproveSubmissionDialog {
  private readonly dialogRef =
    inject<DialogRef<ApproveSubmissionDialogResult>>(DialogRef);
  protected readonly data = inject<ApproveSubmissionDialogData>(DIALOG_DATA);

  protected readonly title = `Approve "${this.data.submission.title}"?`;
  protected readonly whenLabel = formatWhen(this.data.submission.startsAtLocal, 'date');

  protected cancel(): void { this.dialogRef.close(); }
  protected approve(): void { this.dialogRef.close('approve'); }
}
