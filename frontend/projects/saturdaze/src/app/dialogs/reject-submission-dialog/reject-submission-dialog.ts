import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EventSubmissionDto } from 'api';
import { Button, Card, Dialog as DialogShell, Icon } from 'components';

export interface RejectSubmissionDialogData {
  readonly submission: EventSubmissionDto;
}

export type RejectSubmissionDialogResult = { readonly reason: string | null } | undefined;

@Component({
  selector: 'app-reject-submission-dialog',
  standalone: true,
  imports: [Button, Card, DialogShell, FormsModule, Icon],
  templateUrl: './reject-submission-dialog.html',
  styleUrl: './reject-submission-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RejectSubmissionDialog {
  private readonly dialogRef =
    inject<DialogRef<RejectSubmissionDialogResult>>(DialogRef);
  protected readonly data = inject<RejectSubmissionDialogData>(DIALOG_DATA);

  protected readonly reason = signal('');

  protected cancel(): void { this.dialogRef.close(); }

  protected reject(): void {
    const reason = this.reason().trim();
    this.dialogRef.close({ reason: reason.length > 0 ? reason : null });
  }
}
