import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MAX_DRIVE_OPTIONS, PlanningSettings } from 'api';
import { Banner, Button, Dialog as DialogShell, Select, SelectOption } from 'components';

import { saveError } from '../../shared/server-errors';

/** What a "How you plan" dialog edits and how it saves (L2-197). */
export interface PlanningDialogData {
  readonly initial: PlanningSettings;
  /** Saves through `PUT /api/family`; a rejection keeps the dialog open with its message. */
  readonly save: (next: PlanningSettings) => Promise<void>;
}

const OPTIONS: readonly SelectOption[] = MAX_DRIVE_OPTIONS.map((o) => ({
  value: String(o.value),
  label: o.label,
}));

/**
 * D35 — how far the family will drive, each way (L2-191, L2-197). Nothing
 * further is planned, listed or suggested.
 */
@Component({
  selector: 'app-max-drive-dialog',
  standalone: true,
  imports: [Banner, Button, DialogShell, FormsModule, Select],
  templateUrl: './max-drive-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaxDriveDialog {
  private readonly dialogRef = inject<DialogRef<boolean>>(DialogRef);
  private readonly data = inject<PlanningDialogData>(DIALOG_DATA);

  protected readonly options = OPTIONS;
  protected readonly minutes = signal(String(this.data.initial.maxDriveMinutes));
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    this.error.set('');
    try {
      await this.data.save({ ...this.data.initial, maxDriveMinutes: Number(this.minutes()) });
      this.dialogRef.close(true);
    } catch (err) {
      this.error.set(saveError(err));
    } finally {
      this.saving.set(false);
    }
  }
}
