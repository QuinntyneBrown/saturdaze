import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { WeekendDay } from 'api';
import { Button, Dialog as DialogShell, Icon, SegRadio, SegRadioOption, TextInput } from 'components';

export interface CommitmentDialogInitial {
  readonly title: string;
  /** Saturday | Sunday; null when the stored day is a weekday. */
  readonly day: WeekendDay | null;
  /** "HH:mm". */
  readonly startTime: string;
  readonly endTime: string;
}

export interface CommitmentDialogData {
  readonly mode: 'add' | 'edit';
  readonly initial?: CommitmentDialogInitial;
  /** Other commitments, for the duplicate check. */
  readonly siblings: readonly { readonly title: string; readonly day: WeekendDay | null }[];
}

export type CommitmentDialogResult =
  | {
      readonly kind: 'save';
      readonly title: string;
      readonly day: WeekendDay | null;
      readonly startTime: string;
      readonly endTime: string;
    }
  | { readonly kind: 'remove' };

const DAYS: readonly SegRadioOption[] = [
  { value: 'Saturday', label: 'Saturday' },
  { value: 'Sunday', label: 'Sunday' },
];

/**
 * D18 — add or edit a recurring commitment: name, one day, start and end.
 * Commitments are single-day in the API. A commitment stored on a weekday
 * keeps its day when saved from here (the radio shows neither).
 */
@Component({
  selector: 'app-commitment-dialog',
  standalone: true,
  imports: [Button, DialogShell, FormsModule, Icon, SegRadio, TextInput],
  templateUrl: './commitment-dialog.html',
  styleUrl: './commitment-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommitmentDialog {
  private readonly dialogRef = inject<DialogRef<CommitmentDialogResult>>(DialogRef);
  protected readonly data = inject<CommitmentDialogData>(DIALOG_DATA);

  protected readonly days = DAYS;
  protected readonly isEdit = this.data.mode === 'edit';
  protected readonly title = this.isEdit
    ? `Edit ${this.data.initial?.title ?? 'commitment'}`
    : 'Add a commitment';
  protected readonly submitLabel = this.isEdit ? 'Save' : 'Add commitment';

  protected readonly name = signal(this.data.initial?.title ?? '');
  protected readonly day = signal<string>(this.data.initial?.day ?? (this.isEdit ? '' : 'Saturday'));
  protected readonly startTime = signal(this.data.initial?.startTime ?? '09:00');
  protected readonly endTime = signal(this.data.initial?.endTime ?? '10:00');
  protected readonly error = signal('');

  protected readonly canSubmit = computed(
    () =>
      this.name().trim().length > 0 &&
      this.startTime().length > 0 &&
      this.endTime().length > 0 &&
      (this.day().length > 0 || (this.isEdit && this.data.initial?.day === null)),
  );

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected remove(): void {
    this.dialogRef.close({ kind: 'remove' });
  }

  protected submit(event?: Event): void {
    event?.preventDefault();
    const title = this.name().trim();
    if (!title) {
      this.error.set('Enter a name.');
      return;
    }
    if (this.startTime() >= this.endTime()) {
      this.error.set('Start time must be before end time.');
      return;
    }
    const day = (this.day() || null) as WeekendDay | null;
    const duplicate = this.data.siblings.some(
      (s) => s.title.toLowerCase() === title.toLowerCase() && s.day === day,
    );
    if (duplicate) {
      this.error.set('That commitment is already on that day.');
      return;
    }
    this.dialogRef.close({
      kind: 'save',
      title,
      day,
      startTime: this.startTime(),
      endTime: this.endTime(),
    });
  }
}
