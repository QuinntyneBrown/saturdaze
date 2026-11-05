import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DatePlanningView, MealSlot, WeekendDay } from 'api';
import {
  Button,
  Checkbox,
  Dialog as DialogShell,
  Icon,
  SegRadio,
  SegRadioOption,
  Well,
} from 'components';

export interface PlanDateDialogData {
  readonly planning: DatePlanningView;
}

export interface PlanDateDialogResult {
  readonly day: WeekendDay;
  readonly meal: MealSlot;
  readonly attendeeIds: readonly string[];
}

export const MEALS: readonly SegRadioOption[] = (['Breakfast', 'Lunch', 'Dinner'] as const).map(
  (m) => ({
    value: m,
    label: m,
  }),
);
export const DAYS: readonly SegRadioOption[] = (['Saturday', 'Sunday'] as const).map((d) => ({
  value: d,
  label: d,
}));

/**
 * D38 — plan a date: meal, day and the two adults going (L2-225 AC1). With
 * fewer than two adults it is D38b: the reason, and nothing can be chosen (AC2).
 */
@Component({
  selector: 'app-plan-date-dialog',
  standalone: true,
  imports: [Button, Checkbox, DialogShell, FormsModule, Icon, SegRadio, Well],
  templateUrl: './plan-date-dialog.html',
  styleUrl: './plan-date-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanDateDialog {
  private readonly dialogRef = inject<DialogRef<PlanDateDialogResult>>(DialogRef);
  protected readonly data = inject<PlanDateDialogData>(DIALOG_DATA);

  protected readonly meals = MEALS;
  protected readonly days = DAYS;
  protected readonly canPlan = this.data.planning.canPlan;
  protected readonly meal = signal<string>('Dinner');
  protected readonly day = signal<string>('Saturday');
  protected readonly going = signal<readonly string[]>(
    this.data.planning.adults.slice(0, 2).map((a) => a.id),
  );
  protected readonly ready = computed(() => this.canPlan && this.going().length === 2);

  protected isGoing(id: string): boolean {
    return this.going().includes(id);
  }

  protected toggle(id: string, on: boolean): void {
    this.going.update((ids) =>
      on ? [...ids.filter((i) => i !== id), id] : ids.filter((i) => i !== id),
    );
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected confirm(): void {
    if (!this.ready()) return;
    this.dialogRef.close({
      day: this.day() as WeekendDay,
      meal: this.meal() as MealSlot,
      attendeeIds: this.going(),
    });
  }
}
