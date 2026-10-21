import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { CalendarExport } from 'api';
import { Banner, Button, Dialog as DialogShell, Disc, Icon, List, ListItem } from 'components';

export interface CalendarDialogData {
  readonly calendar: CalendarExport;
  /** The signed-in calendar file (L2-086 AC9); a bare link would carry no bearer. */
  readonly download: () => Promise<Blob>;
  /** The caller's Google Calendar is connected and already has the weekend (D6b, L2-168). */
  readonly googleSynced?: boolean;
}

/**
 * D6 — "Add to your calendar": one .ics with both days, fetched with the
 * family's session and saved under the file name shown.
 */
@Component({
  selector: 'app-calendar-dialog',
  standalone: true,
  imports: [Banner, Button, DialogShell, Disc, Icon, List, ListItem],
  templateUrl: './calendar-dialog.html',
  styleUrl: './calendar-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarDialog {
  private readonly dialogRef = inject<DialogRef<void>>(DialogRef);
  private readonly data = inject<CalendarDialogData>(DIALOG_DATA);
  private readonly document = inject(DOCUMENT);
  protected readonly calendar = this.data.calendar;
  protected readonly googleSynced = this.data.googleSynced ?? false;
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected readonly summary = `${this.calendar.eventCount} events · Saturday and Sunday`;

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async download(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      const blob = await this.data.download();
      const url = URL.createObjectURL(blob);
      const link = this.document.createElement('a');
      link.href = url;
      link.download = this.calendar.fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      this.dialogRef.close();
    } catch {
      this.error.set('Could not get the calendar file. Try again.');
    } finally {
      this.busy.set(false);
    }
  }
}
