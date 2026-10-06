import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  IdeaKind,
  IdeaPlacementView,
  IdeaRequest,
  IdeaTiming,
  WEEKEND_PLAN_SERVICE,
  WeekendDay,
} from 'api';
import {
  Banner,
  Button,
  Dialog as DialogShell,
  Icon,
  SegRadio,
  SegRadioOption,
  Select,
  SelectOption,
  Well,
} from 'components';

export interface AddToDayDialogData {
  readonly ideaKind: IdeaKind;
  readonly ideaId: string;
  readonly title: string;
}

/** The day the idea was added to, or nothing when cancelled. */
export type AddToDayDialogResult = WeekendDay;

const DAYS: readonly SegRadioOption[] = [
  { value: 'Saturday', label: 'Saturday' },
  { value: 'Sunday', label: 'Sunday' },
];

const TIMINGS: readonly SelectOption[] = [
  { value: 'bestFit', label: 'Best fit' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
];

/**
 * D28 — "Add Royal Botanical Gardens" (L2-107). Which day and roughly when; the
 * well previews the placement the planner proposes and what it replaces, and the
 * confirm stays disabled when the day has no room around locked blocks.
 */
@Component({
  selector: 'app-add-to-day-dialog',
  standalone: true,
  imports: [Banner, Button, DialogShell, FormsModule, Icon, SegRadio, Select, Well],
  templateUrl: './add-to-day-dialog.html',
  styleUrl: './add-to-day-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddToDayDialog {
  private readonly dialogRef = inject<DialogRef<AddToDayDialogResult>>(DialogRef);
  private readonly weekend = inject(WEEKEND_PLAN_SERVICE);
  protected readonly data = inject<AddToDayDialogData>(DIALOG_DATA);

  protected readonly days = DAYS;
  protected readonly timings = TIMINGS;
  protected readonly day = signal<WeekendDay>('Saturday');
  protected readonly timing = signal<IdeaTiming>('bestFit');
  protected readonly preview = signal<IdeaPlacementView | null>(null);
  protected readonly error = signal('');
  protected readonly submitting = signal(false);

  protected readonly title = `Add ${this.data.title}`;
  protected readonly canConfirm = computed(
    () => !!this.preview()?.fits && !this.submitting() && !this.error(),
  );

  private requestSeq = 0;

  constructor() {
    void this.refresh();
  }

  protected setDay(value: string): void {
    this.day.set(value === 'Sunday' ? 'Sunday' : 'Saturday');
    void this.refresh();
  }

  protected setTiming(value: string): void {
    this.timing.set((TIMINGS.find((t) => t.value === value)?.value ?? 'bestFit') as IdeaTiming);
    void this.refresh();
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async confirm(): Promise<void> {
    if (!this.canConfirm()) return;
    this.submitting.set(true);
    try {
      await this.weekend.addIdea(this.request());
      this.dialogRef.close(this.day());
    } catch {
      this.error.set('That did not go through. The weekend may have changed; try again.');
      void this.refresh();
    } finally {
      this.submitting.set(false);
    }
  }

  private request(): IdeaRequest {
    return {
      ideaKind: this.data.ideaKind,
      ideaId: this.data.ideaId,
      day: this.day(),
      timing: this.timing(),
    };
  }

  /** Ask the planner again; a slower earlier answer never overwrites a newer one. */
  private async refresh(): Promise<void> {
    const seq = ++this.requestSeq;
    this.preview.set(null);
    this.error.set('');
    try {
      const view = await this.weekend.previewIdea(this.request());
      if (seq === this.requestSeq) this.preview.set(view);
    } catch {
      if (seq === this.requestSeq)
        this.error.set('Could not check the plan. Try again in a moment.');
    }
  }
}
