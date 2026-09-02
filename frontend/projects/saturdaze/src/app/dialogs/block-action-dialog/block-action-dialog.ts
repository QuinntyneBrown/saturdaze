import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import type { Block } from 'api';
import { Button, Card, Chip, Dialog as DialogShell, Icon } from 'components';

/**
 * Block Action Dialog Data.
 */
export interface BlockActionDialogData {
  /**
   * Block.
   */
  readonly block: Block;
}

/** What the user chose. Dismissal resolves `undefined`. */
export type BlockActionDialogResult =
  | { readonly kind: 'lock'; readonly locked: boolean }
  | { readonly kind: 'swap' }
  | { readonly kind: 'done'; readonly done: boolean };

/**
 * The block sheet: why the planner picked this, plus Lock / Unlock, "Swap
 * for another" (activities only, L2-015) and "Mark done" (errands, L2-022).
 * Commitments are always locked and cannot be unlocked here.
 */
@Component({
  selector: 'app-block-action-dialog',
  standalone: true,
  imports: [Button, Card, Chip, DialogShell, Icon],
  templateUrl: './block-action-dialog.html',
  styleUrl: './block-action-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockActionDialog {
  private readonly dialogRef = inject<DialogRef<BlockActionDialogResult>>(DialogRef);
  protected readonly data = inject<BlockActionDialogData>(DIALOG_DATA);

  protected readonly block: Block = this.data.block;
  protected readonly subtitle = [
    this.block.day,
    this.block.time,
    this.block.duration,
  ].filter((part) => !!part).join(' · ');

  protected readonly isCommitment = this.block.kind === 'Commitment';
  protected readonly isActivity = this.block.kind === 'Activity';
  protected readonly isErrand = this.block.kind === 'Errand' && !!this.block.refId;
  protected readonly canSwap = this.isActivity && !this.block.locked;
  protected readonly swapHint = !this.isActivity
    ? ''
    : this.block.locked
      ? 'Unlock the block to swap it.'
      : 'I will pick the next-best activity that fits the same slot.';

  protected close(): void {
    this.dialogRef.close();
  }

  protected toggleLock(): void {
    this.dialogRef.close({ kind: 'lock', locked: !(this.block.locked ?? false) });
  }

  protected swap(): void {
    if (!this.canSwap) return;
    this.dialogRef.close({ kind: 'swap' });
  }

  protected toggleDone(): void {
    this.dialogRef.close({ kind: 'done', done: !(this.block.done ?? false) });
  }
}
