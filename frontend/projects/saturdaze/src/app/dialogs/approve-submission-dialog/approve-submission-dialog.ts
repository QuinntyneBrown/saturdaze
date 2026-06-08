import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { EventSubmissionDto } from 'api';
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
  protected readonly whenLabel = formatWhen(this.data.submission.startsAtLocal);

  protected cancel(): void { this.dialogRef.close(); }
  protected approve(): void { this.dialogRef.close('approve'); }
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: d.getMinutes() === 0 ? undefined : '2-digit',
  });
}
