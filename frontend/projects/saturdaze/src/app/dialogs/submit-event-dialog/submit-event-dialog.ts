import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EVENT_SUBMISSIONS_SERVICE, EventSubmissionDto } from 'api';
import { Button, Dialog as DialogShell, TextInput } from 'components';

import { nextHourFromNowAsInputValue } from '../../shared/next-hour-default';

export type SubmitEventDialogResult = EventSubmissionDto | undefined;

/**
 * D10 — "Suggest an event". Title and start time are required; the rest
 * helps families decide. Submits itself so the error shows inline, and
 * closes with the created submission.
 */
@Component({
  selector: 'app-submit-event-dialog',
  standalone: true,
  imports: [Button, DialogShell, FormsModule, TextInput],
  templateUrl: './submit-event-dialog.html',
  styleUrl: './submit-event-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubmitEventDialog {
  private readonly dialogRef = inject<DialogRef<SubmitEventDialogResult>>(DialogRef);
  private readonly submissions = inject(EVENT_SUBMISSIONS_SERVICE);

  protected readonly title = signal('');
  protected readonly startsAtLocal = signal(nextHourFromNowAsInputValue(new Date()));
  protected readonly endsAtLocal = signal('');
  protected readonly location = signal('');
  protected readonly description = signal('');
  protected readonly costNote = signal('');
  protected readonly ageRange = signal('');
  protected readonly sourceUrl = signal('');
  protected readonly error = signal('');
  protected readonly submitting = signal(false);

  protected readonly dateError = computed(() =>
    this.startsAtLocal().trim().length === 0 ? 'Pick a start date and time.' : '',
  );

  protected readonly canSubmit = computed(
    () =>
      this.title().trim().length > 0 && this.startsAtLocal().trim().length > 0 && !this.submitting(),
  );

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async submit(event?: Event): Promise<void> {
    event?.preventDefault();
    if (!this.canSubmit()) return;

    this.submitting.set(true);
    this.error.set('');
    try {
      const created = await this.submissions.submit({
        title: this.title().trim(),
        startsAtLocal: this.startsAtLocal(),
        endsAtLocal: this.endsAtLocal().trim() || null,
        location: this.location().trim() || null,
        description: this.description().trim() || null,
        costNote: this.costNote().trim() || null,
        ageRange: this.ageRange().trim() || null,
        sourceUrl: this.sourceUrl().trim() || null,
      });
      this.dialogRef.close(created);
    } catch (err) {
      this.error.set('Could not send that. Try again in a moment.');
      console.error('SubmitEventDialog.submit failed', err);
    } finally {
      this.submitting.set(false);
    }
  }
}
