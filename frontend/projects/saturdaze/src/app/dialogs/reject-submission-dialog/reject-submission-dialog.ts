import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SubmissionCard } from 'api';
import { Button, Dialog as DialogShell, Icon, TextInput } from 'components';

export interface RejectSubmissionDialogData {
  readonly card: SubmissionCard;
}

export interface RejectSubmissionDialogResult {
  readonly reason: string;
}

/**
 * D24 — "Reject this suggestion?" with an optional reason.
 */
@Component({
  selector: 'app-reject-submission-dialog',
  standalone: true,
  imports: [Button, DialogShell, FormsModule, Icon, TextInput],
  templateUrl: './reject-submission-dialog.html',
  styleUrl: './reject-submission-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RejectSubmissionDialog {
  private readonly dialogRef = inject<DialogRef<RejectSubmissionDialogResult>>(DialogRef);
  protected readonly card = inject<RejectSubmissionDialogData>(DIALOG_DATA).card;

  protected readonly reason = signal('');

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected reject(event?: Event): void {
    event?.preventDefault();
    this.dialogRef.close({ reason: this.reason().trim() });
  }
}
