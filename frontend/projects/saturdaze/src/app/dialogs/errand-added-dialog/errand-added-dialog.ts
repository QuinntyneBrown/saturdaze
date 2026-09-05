import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ErrandPlacement } from 'api';
import { Button, Dialog as DialogShell, Disc, List, ListItem } from 'components';

export interface ErrandAddedDialogData {
  readonly placement: ErrandPlacement;
}

/**
 * D9 — "Added to Sunday at 9:15": where the planner put the errand.
 */
@Component({
  selector: 'app-errand-added-dialog',
  standalone: true,
  imports: [Button, DialogShell, Disc, List, ListItem],
  templateUrl: './errand-added-dialog.html',
  styleUrl: './errand-added-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrandAddedDialog {
  private readonly dialogRef = inject<DialogRef<void>>(DialogRef);
  protected readonly placement = inject<ErrandAddedDialogData>(DIALOG_DATA).placement;

  protected readonly title = `Added to ${this.placement.day} at ${this.placement.time}`;
  protected readonly when = `${this.placement.day} · ${this.placement.time} to ${this.placement.endTime}`;

  protected done(): void {
    this.dialogRef.close();
  }
}
