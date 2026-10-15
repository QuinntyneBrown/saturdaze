import { DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EVENT_SUBMISSIONS_SERVICE, EventSubmissionDto } from 'api';
import {
  Button,
  Dialog as DialogShell,
  ErrorSummary,
  ErrorSummaryProblem,
  TextInput,
} from 'components';

import { nextHourFromNowAsInputValue } from '../../shared/next-hour-default';

export type SubmitEventDialogResult = EventSubmissionDto | undefined;

/**
 * D10 — "Suggest an event". Title and start time are required; the rest
 * helps families decide. The action stays enabled: pressing it with a gap
 * shows an error summary instead (L2-134). Submits itself so a server error
 * shows inline, and closes with the created submission.
 */
@Component({
  selector: 'app-submit-event-dialog',
  standalone: true,
  imports: [Button, DialogShell, ErrorSummary, FormsModule, TextInput],
  templateUrl: './submit-event-dialog.html',
  styleUrl: './submit-event-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubmitEventDialog {
  private readonly dialogRef = inject<DialogRef<SubmitEventDialogResult>>(DialogRef);
  private readonly submissions = inject(EVENT_SUBMISSIONS_SERVICE);
  private readonly injector = inject(Injector);
  private readonly summary = viewChild(ErrorSummary);
  private readonly titleField = viewChild<TextInput>('titleField');
  private readonly startsField = viewChild<TextInput>('startsField');

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
  /** Set by the first press of the action; from then on the summary tracks the fields. */
  private readonly attempted = signal(false);

  protected readonly dateError = computed(() =>
    this.startsAtLocal().trim().length === 0 ? 'Pick a start date and time.' : '',
  );

  /** What is wrong, once a submit was tried; each line leaves as its field is fixed. */
  protected readonly problems = computed<ErrorSummaryProblem[]>(() => {
    if (!this.attempted()) return [];
    const found: ErrorSummaryProblem[] = [];
    if (this.title().trim().length === 0) {
      found.push({ id: 'title', message: 'Enter a title for the event' });
    }
    if (this.startsAtLocal().trim().length === 0) {
      found.push({ id: 'starts', message: 'Pick a start date and time' });
    }
    return found;
  });

  protected readonly titleError = computed(() =>
    this.problems().some((p) => p.id === 'title') ? 'Enter a title for the event.' : '',
  );

  protected focusField(id: string): void {
    (id === 'title' ? this.titleField() : this.startsField())?.focus();
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async submit(event?: Event): Promise<void> {
    event?.preventDefault();
    if (this.submitting()) return;
    this.attempted.set(true);
    if (this.problems().length > 0) {
      afterNextRender(() => this.summary()?.focus(), { injector: this.injector });
      return;
    }

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
