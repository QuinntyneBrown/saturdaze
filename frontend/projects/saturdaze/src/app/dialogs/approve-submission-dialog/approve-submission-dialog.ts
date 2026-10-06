import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApprovalLocation, SubmissionCard } from 'api';
import { Button, Card, DateTile, Dialog as DialogShell, Icon, TextInput } from 'components';

export interface ApproveSubmissionDialogData {
  readonly card: SubmissionCard;
}

/** Confirmed with the location to publish at (L2-087 AC3). */
export interface ApproveSubmissionDialogResult {
  readonly location: ApprovalLocation;
}

/**
 * D23 — "Approve Port Credit Buskerfest?" with the event's location:
 * address (seeded from the submission) and coordinates. Blank coordinates
 * keep the submission's own; the API refuses when there are none.
 */
@Component({
  selector: 'app-approve-submission-dialog',
  standalone: true,
  imports: [Button, Card, DateTile, DialogShell, FormsModule, Icon, TextInput],
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

  protected readonly address = signal(this.card.location ?? '');
  protected readonly latitude = signal('');
  protected readonly longitude = signal('');

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected confirm(event?: Event): void {
    event?.preventDefault();
    this.dialogRef.close({
      location: {
        latitude: toCoordinate(this.latitude()),
        longitude: toCoordinate(this.longitude()),
        address: this.address().trim(),
      },
    });
  }
}

function toCoordinate(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}
