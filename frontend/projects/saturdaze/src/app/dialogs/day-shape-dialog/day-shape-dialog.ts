import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { BEDTIME_OPTIONS, DAY_START_OPTIONS, PlanLeaning } from 'api';
import {
  Banner,
  Button,
  Dialog as DialogShell,
  List,
  ListItem,
  SegRadio,
  SegRadioOption,
  Select,
  SelectOption,
  Toggle,
} from 'components';

import { saveError } from '../../shared/server-errors';
import { PlanningDialogData } from '../max-drive-dialog/max-drive-dialog';

/** "No set time" travels as '' through the select and as null to the API. */
const NO_BEDTIME = '';

const DAY_STARTS: readonly SelectOption[] = DAY_START_OPTIONS.map((o) => ({ ...o }));
const BEDTIMES: readonly SelectOption[] = BEDTIME_OPTIONS.map((o) => ({
  value: o.value ?? NO_BEDTIME,
  label: o.label,
}));
const PACE: readonly SegRadioOption[] = ['1', '2', '3'].map((n) => ({ value: n, label: n }));
const LEANING: readonly SegRadioOption[] = (['Indoor', 'Either', 'Outdoor'] as const).map((l) => ({
  value: l,
  label: l,
}));

/**
 * D37 — the shape of each day (L2-195, L2-196, L2-197): when it starts and
 * ends, how many outings, indoor or outdoor, and Sunday dinner at home.
 */
@Component({
  selector: 'app-day-shape-dialog',
  standalone: true,
  imports: [Banner, Button, DialogShell, FormsModule, List, ListItem, SegRadio, Select, Toggle],
  templateUrl: './day-shape-dialog.html',
  styleUrl: './day-shape-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayShapeDialog {
  private readonly dialogRef = inject<DialogRef<boolean>>(DialogRef);
  private readonly data = inject<PlanningDialogData>(DIALOG_DATA);

  protected readonly dayStarts = DAY_STARTS;
  protected readonly bedtimes = BEDTIMES;
  protected readonly pace = PACE;
  protected readonly leanings = LEANING;

  protected readonly dayStart = signal(this.data.initial.dayStart);
  protected readonly bedtime = signal(this.data.initial.youngestBedtime ?? NO_BEDTIME);
  protected readonly outings = signal(String(this.data.initial.outingsPerDay));
  protected readonly leaning = signal<string>(this.data.initial.leaning);
  protected readonly sundayDinnerAtHome = signal(this.data.initial.sundayDinnerAtHome);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    this.error.set('');
    try {
      await this.data.save({
        ...this.data.initial,
        dayStart: this.dayStart(),
        youngestBedtime: this.bedtime() || null,
        outingsPerDay: Number(this.outings()),
        leaning: this.leaning() as PlanLeaning,
        sundayDinnerAtHome: this.sundayDinnerAtHome(),
      });
      this.dialogRef.close(true);
    } catch (err) {
      this.error.set(saveError(err));
    } finally {
      this.saving.set(false);
    }
  }
}
