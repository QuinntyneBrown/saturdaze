import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Button, CopyField, Dialog as DialogShell, List, ListItem } from 'components';

export interface CalendarFeedDialogData {
  /** The `webcal://` link, shown only here (L2-171). */
  readonly webcalUrl: string;
}

/** "Stop the link" — the page confirms (D34) and stops it. */
export type CalendarFeedDialogResult = 'stop';

/** Where each calendar application takes a subscription link. */
const STEPS = [
  { app: 'Apple Calendar', how: 'File, New Calendar Subscription, then paste the link.' },
  { app: 'Outlook', how: 'Add calendar, Subscribe from web, then paste the link.' },
  { app: 'Google Calendar', how: 'Other calendars, From URL. Use https:// in place of webcal://.' },
] as const;

/**
 * D33 — "Subscribe from another calendar": the family's new subscription link
 * in a copy field, once, with the steps for Apple Calendar, Outlook and
 * Google Calendar (L2-172).
 */
@Component({
  selector: 'app-calendar-feed-dialog',
  standalone: true,
  imports: [Button, CopyField, DialogShell, List, ListItem],
  templateUrl: './calendar-feed-dialog.html',
  styleUrl: './calendar-feed-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarFeedDialog {
  private readonly dialogRef = inject<DialogRef<CalendarFeedDialogResult>>(DialogRef);
  protected readonly data = inject<CalendarFeedDialogData>(DIALOG_DATA);
  protected readonly steps = STEPS;

  protected done(): void {
    this.dialogRef.close();
  }

  protected stop(): void {
    this.dialogRef.close('stop');
  }
}
