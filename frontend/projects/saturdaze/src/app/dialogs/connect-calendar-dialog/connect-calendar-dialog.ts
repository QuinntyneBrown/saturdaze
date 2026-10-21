import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { Banner, Button, Dialog as DialogShell, Disc, Icon, List, ListItem } from 'components';

export interface ConnectCalendarDialogData {
  /** Asks the API for Google's consent URL and sends the browser there; rejects when it cannot. */
  readonly start: () => Promise<void>;
}

/**
 * D31 — "Connect Google Calendar": what Saturdaze writes and reads, before
 * Google's own consent screen (L2-166). "Continue to Google" sends the browser
 * to Google; a failure to start keeps the dialog open with D31b's banner.
 */
@Component({
  selector: 'app-connect-calendar-dialog',
  standalone: true,
  imports: [Banner, Button, DialogShell, Disc, Icon, List, ListItem],
  templateUrl: './connect-calendar-dialog.html',
  styleUrl: './connect-calendar-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectCalendarDialog {
  private readonly dialogRef = inject<DialogRef<void>>(DialogRef);
  protected readonly data = inject<ConnectCalendarDialogData>(DIALOG_DATA);

  protected readonly starting = signal(false);
  protected readonly failed = signal(false);

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async continue(): Promise<void> {
    this.starting.set(true);
    this.failed.set(false);
    try {
      await this.data.start();
    } catch {
      this.failed.set(true);
      this.starting.set(false);
    }
  }
}
