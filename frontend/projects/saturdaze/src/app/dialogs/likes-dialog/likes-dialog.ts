import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Button, ChipInput, Dialog as DialogShell } from 'components';

export interface LikesDialogData {
  readonly likes: readonly string[];
  readonly dislikes: readonly string[];
}

export interface LikesDialogResult {
  readonly likes: string[];
  readonly dislikes: string[];
}

/**
 * D20 — "Likes and dislikes": two tag editors.
 */
@Component({
  selector: 'app-likes-dialog',
  standalone: true,
  imports: [Button, ChipInput, DialogShell, FormsModule],
  templateUrl: './likes-dialog.html',
  styleUrl: './likes-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LikesDialog {
  private readonly dialogRef = inject<DialogRef<LikesDialogResult>>(DialogRef);
  protected readonly data = inject<LikesDialogData>(DIALOG_DATA);

  protected readonly likes = signal<string[]>([...this.data.likes]);
  protected readonly dislikes = signal<string[]>([...this.data.dislikes]);

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected save(): void {
    this.dialogRef.close({ likes: this.likes(), dislikes: this.dislikes() });
  }
}
