import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Button, Dialog as DialogShell, TextInput } from 'components';

export interface HomeLocationDialogData {
  readonly location: string;
}

/**
 * D19 — "Home location". Closes with the trimmed, non-blank value.
 */
@Component({
  selector: 'app-home-location-dialog',
  standalone: true,
  imports: [Button, DialogShell, FormsModule, TextInput],
  templateUrl: './home-location-dialog.html',
  styleUrl: './home-location-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeLocationDialog {
  private readonly dialogRef = inject<DialogRef<string>>(DialogRef);
  protected readonly data = inject<HomeLocationDialogData>(DIALOG_DATA);

  protected readonly location = signal(this.data.location);
  protected readonly canSave = computed(() => this.location().trim().length > 0);

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected save(event?: Event): void {
    event?.preventDefault();
    if (!this.canSave()) return;
    this.dialogRef.close(this.location().trim());
  }
}
