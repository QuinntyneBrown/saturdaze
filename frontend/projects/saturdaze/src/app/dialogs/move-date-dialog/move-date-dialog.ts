import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MealSlot, WeekendDay } from 'api';
import { Button, Dialog as DialogShell, Icon, SegRadio } from 'components';

import { DAYS, MEALS } from '../plan-date-dialog/plan-date-dialog';

export interface MoveDateDialogData {
  readonly day: WeekendDay;
  readonly meal: MealSlot;
}

/** D41 — move the date to another meal or day (L2-223 AC4, L2-225 AC4). */
@Component({
  selector: 'app-move-date-dialog',
  standalone: true,
  imports: [Button, DialogShell, FormsModule, Icon, SegRadio],
  templateUrl: './move-date-dialog.html',
  styleUrl: '../plan-date-dialog/plan-date-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoveDateDialog {
  private readonly dialogRef = inject<DialogRef<MoveDateDialogData>>(DialogRef);
  private readonly data = inject<MoveDateDialogData>(DIALOG_DATA);

  protected readonly meals = MEALS;
  protected readonly days = DAYS;
  protected readonly meal = signal<string>(this.data.meal);
  protected readonly day = signal<string>(this.data.day);

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected confirm(): void {
    this.dialogRef.close({ day: this.day() as WeekendDay, meal: this.meal() as MealSlot });
  }
}
