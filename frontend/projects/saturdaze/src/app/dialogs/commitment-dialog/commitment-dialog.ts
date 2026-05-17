import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EditableCommitment, EditableFamilyDayOfWeek } from 'api';
import { Button, Dialog as DialogShell, Icon } from 'components';

const DAYS: readonly EditableFamilyDayOfWeek[] = [
  'Saturday',
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
];

export interface CommitmentDialogData {
  readonly mode: 'add' | 'edit';
  readonly initial?: EditableCommitment;
  /** Existing commitments minus the one being edited; used for uniqueness check. */
  readonly siblings: readonly EditableCommitment[];
}

export type CommitmentDialogResult = EditableCommitment;

@Component({
  selector: 'app-commitment-dialog',
  standalone: true,
  imports: [Button, DialogShell, FormsModule, Icon],
  templateUrl: './commitment-dialog.html',
  styleUrl: './commitment-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommitmentDialog {
  private readonly dialogRef =
    inject<DialogRef<CommitmentDialogResult>>(DialogRef);
  protected readonly data = inject<CommitmentDialogData>(DIALOG_DATA);

  protected readonly days = DAYS;
  protected readonly title =
    this.data.mode === 'add'
      ? 'Add a commitment'
      : `Edit ${this.data.initial?.title ?? 'commitment'}`;
  protected readonly subtitle =
    this.data.mode === 'add'
      ? 'Something I should plan around every week'
      : 'Update title, day, or time';
  protected readonly submitLabel = this.data.mode === 'add' ? 'Add commitment' : 'Save';

  protected readonly commitmentTitle = signal(this.data.initial?.title ?? '');
  protected readonly dayOfWeek = signal<EditableFamilyDayOfWeek>(
    this.data.initial?.dayOfWeek ?? 'Saturday',
  );
  protected readonly startTime = signal(this.data.initial?.startTime ?? '09:00');
  protected readonly endTime = signal(this.data.initial?.endTime ?? '10:00');
  protected readonly error = signal('');
  protected readonly canSubmit = computed(() => this.commitmentTitle().trim().length > 0);

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const title = this.commitmentTitle().trim();
    if (!title) {
      this.error.set('Enter a commitment title.');
      return;
    }
    if (this.startTime() >= this.endTime()) {
      this.error.set('Start time must be before end time.');
      return;
    }

    const dayOfWeek = this.dayOfWeek();
    const lowerTitle = title.toLowerCase();
    const duplicate = this.data.siblings.some(
      (c) => c.dayOfWeek === dayOfWeek && c.title.toLowerCase() === lowerTitle,
    );
    if (duplicate) {
      this.error.set('Commitments must be unique by title and day.');
      return;
    }

    this.dialogRef.close({
      title,
      dayOfWeek,
      startTime: this.startTime(),
      endTime: this.endTime(),
    });
  }
}
