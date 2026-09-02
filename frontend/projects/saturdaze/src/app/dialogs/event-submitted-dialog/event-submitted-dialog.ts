import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { EventSubmissionDto, formatEventDate } from 'api';
import { Button, Card, Chip, DateTile, Dialog as DialogShell } from 'components';

export interface EventSubmittedDialogData {
  readonly submission: EventSubmissionDto;
}

/**
 * D11 — "Thanks, it is in the queue": the summary of what was sent.
 */
@Component({
  selector: 'app-event-submitted-dialog',
  standalone: true,
  imports: [Button, Card, Chip, DateTile, DialogShell],
  templateUrl: './event-submitted-dialog.html',
  styleUrl: './event-submitted-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventSubmittedDialog {
  private readonly dialogRef = inject<DialogRef<void>>(DialogRef);
  protected readonly data = inject<EventSubmittedDialogData>(DIALOG_DATA);

  protected readonly meta = computed(() => {
    const s = this.data.submission;
    const when = formatEventDate(s.startsAtLocal);
    return s.location ? `${s.location} · ${when}` : when;
  });

  protected done(): void {
    this.dialogRef.close();
  }
}
