import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { DayView } from 'api';
import { Dialog as DialogShell } from 'components';

import { DayMap } from '../../pages/weekend/day-map/day-map';

export interface DayMapDialogData {
  readonly day: DayView;
}

/** The stop number the family picked on the map, to bring into view. */
export type DayMapDialogResult = number;

/**
 * "Open map" below 1024px (L2-105 AC2): the day map full-screen. Picking a pin
 * closes the dialog and the Weekend screen focuses that stop.
 */
@Component({
  selector: 'app-day-map-dialog',
  standalone: true,
  imports: [DayMap, DialogShell],
  template: `
    <sd-dialog wide [title]="data.day.day + ' map'">
      <app-day-map
        [day]="data.day.day"
        [stops]="data.day.stops"
        [home]="data.day.home"
        [drivingMinutes]="data.day.drivingMinutes"
        [drivingKm]="data.day.drivingKm"
        [active]="active()"
        (hover)="active.set($event)"
        (activate)="pick($event)"
      />
    </sd-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayMapDialog {
  private readonly dialogRef = inject<DialogRef<DayMapDialogResult>>(DialogRef);
  protected readonly data = inject<DayMapDialogData>(DIALOG_DATA);
  protected readonly active = signal<number | null>(null);

  protected pick(n: number): void {
    this.dialogRef.close(n);
  }
}
