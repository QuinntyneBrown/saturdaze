import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ErrandPlacement, WEEKEND_PLAN_SERVICE, WeekendDay } from 'api';
import {
  Button,
  Dialog as DialogShell,
  Icon,
  SegRadio,
  SegRadioOption,
  Select,
  SelectOption,
  TextInput,
} from 'components';

export type AddErrandDialogResult = ErrandPlacement | null;

const DURATIONS: readonly SelectOption[] = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '60 min' },
  { value: '90', label: '90 min' },
];

const DAYS: readonly SegRadioOption[] = [
  { value: 'Saturday', label: 'Saturday' },
  { value: 'Sunday', label: 'Sunday' },
  { value: 'either', label: 'Either' },
];

/**
 * D7 — "Add an errand": what, roughly how long, which day. Submits itself
 * and closes with the placement the planner chose (null when it could not
 * be found by diffing the weekend).
 */
@Component({
  selector: 'app-add-errand-dialog',
  standalone: true,
  imports: [Button, DialogShell, FormsModule, Icon, SegRadio, Select, TextInput],
  templateUrl: './add-errand-dialog.html',
  styleUrl: './add-errand-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddErrandDialog {
  private readonly dialogRef = inject<DialogRef<AddErrandDialogResult>>(DialogRef);
  private readonly weekend = inject(WEEKEND_PLAN_SERVICE);

  protected readonly durations = DURATIONS;
  protected readonly days = DAYS;

  protected readonly description = signal('');
  protected readonly minutes = signal('45');
  protected readonly day = signal('either');
  protected readonly error = signal('');
  protected readonly submitting = signal(false);

  protected readonly canSubmit = computed(
    () => this.description().trim().length > 0 && !this.submitting(),
  );

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async submit(event?: Event): Promise<void> {
    event?.preventDefault();
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.error.set('');
    const preferredDay = this.day() === 'either' ? null : (this.day() as WeekendDay);
    try {
      const placement = await this.weekend.addErrand(
        this.description().trim(),
        Number(this.minutes()),
        preferredDay,
      );
      this.dialogRef.close(placement);
    } catch (err) {
      this.error.set('Could not add that. Try again in a moment.');
      console.error('AddErrandDialog.submit failed', err);
    } finally {
      this.submitting.set(false);
    }
  }
}
