import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { CalendarExport } from 'api';
import { Button, Dialog as DialogShell, Disc, Icon, List, ListItem } from 'components';

export interface CalendarDialogData {
  readonly calendar: CalendarExport;
}

/**
 * D6 — "Add to your calendar": one .ics with both days. The download is a
 * plain link to the API, so the browser handles the file.
 */
@Component({
  selector: 'app-calendar-dialog',
  standalone: true,
  imports: [Button, DialogShell, Disc, Icon, List, ListItem],
  templateUrl: './calendar-dialog.html',
  styleUrl: './calendar-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarDialog {
  private readonly dialogRef = inject<DialogRef<void>>(DialogRef);
  protected readonly calendar = inject<CalendarDialogData>(DIALOG_DATA).calendar;

  protected readonly summary = `${this.calendar.eventCount} events · Saturday and Sunday`;

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected downloaded(): void {
    this.dialogRef.close();
  }
}
