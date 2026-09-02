import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Button, Dialog as DialogShell, TextInput } from 'components';

export interface RenameWeekendDialogData {
  /** "10 – 11 May 2026". */
  readonly eyebrow: string;
  readonly title: string | null;
}

export interface RenameWeekendDialogResult {
  /** Blank → null (back to the generated title). */
  readonly title: string | null;
}

/**
 * D14 — "Rename this weekend".
 */
@Component({
  selector: 'app-rename-weekend-dialog',
  standalone: true,
  imports: [Button, DialogShell, FormsModule, TextInput],
  templateUrl: './rename-weekend-dialog.html',
  styleUrl: './rename-weekend-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RenameWeekendDialog {
  private readonly dialogRef = inject<DialogRef<RenameWeekendDialogResult>>(DialogRef);
  protected readonly data = inject<RenameWeekendDialogData>(DIALOG_DATA);

  protected readonly title = signal(this.data.title ?? '');

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected save(event?: Event): void {
    event?.preventDefault();
    const title = this.title().trim();
    this.dialogRef.close({ title: title || null });
  }
}
