import { DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { EVENT_SUBMISSIONS_SERVICE, EventSubmissionDto } from 'api';
import { Button, Card, Dialog as DialogShell, Icon } from 'components';

import { nextHourFromNowAsInputValue } from '../../shared/next-hour-default';

export type SubmitEventDialogResult = EventSubmissionDto | undefined;

@Component({
  selector: 'app-submit-event-dialog',
  standalone: true,
  imports: [Button, Card, DialogShell, FormsModule, Icon],
  templateUrl: './submit-event-dialog.html',
  styleUrl: './submit-event-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubmitEventDialog {
  private readonly dialogRef = inject<DialogRef<SubmitEventDialogResult>>(DialogRef);
  private readonly submissions = inject(EVENT_SUBMISSIONS_SERVICE);
  private readonly router = inject(Router);

  protected readonly title = signal('');
  protected readonly startsAtLocal = signal(nextHourFromNowAsInputValue(new Date()));
  protected readonly location = signal('');
  protected readonly error = signal('');
  protected readonly submitting = signal(false);

  protected readonly canSubmit = computed(
    () => this.title().trim().length > 0 && this.startsAtLocal().length > 0,
  );

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected openFullForm(): void {
    this.dialogRef.close();
    void this.router.navigateByUrl('/events/submit');
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.canSubmit() || this.submitting()) return;

    this.submitting.set(true);
    try {
      const created = await this.submissions.submit({
        title: this.title().trim(),
        startsAtLocal: this.startsAtLocal(),
        location: this.location().trim() || null,
      });
      this.dialogRef.close(created);
    } catch (err) {
      this.error.set('Could not submit — try again, or open the full form.');
      console.error('SubmitEventDialog.submit failed', err);
    } finally {
      this.submitting.set(false);
    }
  }
}
