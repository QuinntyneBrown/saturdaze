import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { WeekendDay } from 'api';
import {
  Banner,
  Button,
  Checkbox,
  Dialog as DialogShell,
  Icon,
  SegRadio,
  SegRadioOption,
  TextInput,
} from 'components';

import { fieldError, saveError } from '../../shared/server-errors';

export interface CommitmentDialogInitial {
  readonly title: string;
  /** Saturday | Sunday; null when the stored day is a weekday. */
  readonly day: WeekendDay | null;
  /** "HH:mm". */
  readonly startTime: string;
  readonly endTime: string;
  /** Who goes; empty means everyone (L2-192). */
  readonly attendeeMemberIds?: readonly string[];
  /** The address the plan drives to; null when it has no place. */
  readonly where?: string | null;
}

export interface CommitmentDialogData {
  readonly mode: 'add' | 'edit';
  readonly initial?: CommitmentDialogInitial;
  /** Other commitments, for the duplicate check. */
  readonly siblings: readonly { readonly title: string; readonly day: WeekendDay | null }[];
  /** The family, for "Who goes" (L2-197). */
  readonly members?: readonly { readonly id: string; readonly name: string }[];
  /**
   * Saves the commitment before the dialog closes, so a 400 (an address the
   * planner cannot find, L2-192 AC7) is shown inside it. Without it the
   * dialog only closes with the result.
   */
  readonly save?: (result: CommitmentSave) => Promise<void>;
}

export interface CommitmentSave {
  readonly kind: 'save';
  readonly title: string;
  readonly day: WeekendDay | null;
  readonly startTime: string;
  readonly endTime: string;
  readonly attendeeMemberIds: readonly string[];
  readonly where: string | null;
}

export type CommitmentDialogResult = CommitmentSave | { readonly kind: 'remove' };

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
  imports: [Banner, Button, Checkbox, DialogShell, FormsModule, Icon, SegRadio, TextInput],
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
  protected readonly day = signal<string>(
    this.data.initial?.day ?? (this.isEdit ? '' : 'Saturday'),
  );
  protected readonly startTime = signal(this.data.initial?.startTime ?? '09:00');
  protected readonly endTime = signal(this.data.initial?.endTime ?? '10:00');
  protected readonly error = signal('');
  protected readonly members = this.data.members ?? [];
  protected readonly attendees = signal<readonly string[]>(
    this.data.initial?.attendeeMemberIds ?? [],
  );
  protected readonly where = signal(this.data.initial?.where ?? '');
  protected readonly whereError = signal('');
  protected readonly saveFailed = signal('');
  protected readonly saving = signal(false);

  protected readonly canSubmit = computed(
    () =>
      this.name().trim().length > 0 &&
      this.startTime().length > 0 &&
      this.endTime().length > 0 &&
      (this.day().length > 0 || (this.isEdit && this.data.initial?.day === null)) &&
      !this.saving(),
  );

  protected goes(id: string): boolean {
    return this.attendees().includes(id);
  }

  protected setGoes(id: string, on: boolean): void {
    const rest = this.attendees().filter((a) => a !== id);
    this.attendees.set(on ? [...rest, id] : rest);
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected remove(): void {
    this.dialogRef.close({ kind: 'remove' });
  }

  protected async submit(event?: Event): Promise<void> {
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
    const result: CommitmentSave = {
      kind: 'save',
      title,
      day,
      startTime: this.startTime(),
      endTime: this.endTime(),
      attendeeMemberIds: this.attendees(),
      where: this.where().trim() || null,
    };
    if (this.data.save) {
      this.saving.set(true);
      this.whereError.set('');
      this.saveFailed.set('');
      try {
        await this.data.save(result);
      } catch (err) {
        const where = fieldError(err, /Location$/);
        if (where) this.whereError.set(where);
        else this.saveFailed.set(saveError(err));
        return;
      } finally {
        this.saving.set(false);
      }
    }
    this.dialogRef.close(result);
  }
}
