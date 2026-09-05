import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { SubmissionCard } from 'api';
import { Button, Card, DateTile, Dialog as DialogShell, Icon } from 'components';

export interface ApproveSubmissionDialogData {
  readonly card: SubmissionCard;
}

export type ApproveSubmissionDialogResult = 'confirm';

/**
 * D23 — "Approve Port Credit Buskerfest?".
 */
@Component({
  selector: 'app-approve-submission-dialog',
  standalone: true,
  imports: [Button, Card, DateTile, DialogShell, Icon],
  templateUrl: './approve-submission-dialog.html',
  styleUrl: './approve-submission-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApproveSubmissionDialog {
  private readonly dialogRef = inject<DialogRef<ApproveSubmissionDialogResult>>(DialogRef);
  protected readonly card = inject<ApproveSubmissionDialogData>(DIALOG_DATA).card;

  protected readonly title = `Approve ${this.card.title}?`;
  protected readonly meta = [
    ...[this.card.location, this.card.cost, this.card.ages].filter((v): v is string => !!v),
    `sent by ${this.card.submitter.email}`,
  ].join(' · ');

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected confirm(): void {
    this.dialogRef.close('confirm');
  }
}
