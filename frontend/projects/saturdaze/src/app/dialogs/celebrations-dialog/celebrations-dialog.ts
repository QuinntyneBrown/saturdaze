import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ContentTheme, LEAVE_OUT, OBSERVANCES } from 'api';
import {
  Banner,
  Button,
  Checkbox,
  Dialog as DialogShell,
  List,
  ListItem,
  Toggle,
} from 'components';

import { saveError } from '../../shared/server-errors';
import { PlanningDialogData } from '../max-drive-dialog/max-drive-dialog';

/**
 * D36 — what the family celebrates (L2-194, L2-195, L2-197): themes left out
 * everywhere, and a quiet Sunday.
 */
@Component({
  selector: 'app-celebrations-dialog',
  standalone: true,
  imports: [Banner, Button, Checkbox, DialogShell, FormsModule, List, ListItem, Toggle],
  templateUrl: './celebrations-dialog.html',
  styleUrl: './celebrations-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CelebrationsDialog {
  private readonly dialogRef = inject<DialogRef<boolean>>(DialogRef);
  private readonly data = inject<PlanningDialogData>(DIALOG_DATA);

  protected readonly observances = OBSERVANCES;
  protected readonly leaveOut = LEAVE_OUT;
  protected readonly excluded = signal<readonly ContentTheme[]>(this.data.initial.excludedThemes);
  protected readonly quietSunday = signal(this.data.initial.quietSunday);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected isExcluded(theme: ContentTheme): boolean {
    return this.excluded().includes(theme);
  }

  protected setExcluded(theme: ContentTheme, on: boolean): void {
    const rest = this.excluded().filter((t) => t !== theme);
    this.excluded.set(on ? [...rest, theme] : rest);
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    this.error.set('');
    try {
      await this.data.save({
        ...this.data.initial,
        excludedThemes: this.excluded(),
        quietSunday: this.quietSunday(),
      });
      this.dialogRef.close(true);
    } catch (err) {
      this.error.set(saveError(err));
    } finally {
      this.saving.set(false);
    }
  }
}
