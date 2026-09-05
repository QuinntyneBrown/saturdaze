import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { BlockRow } from 'api';
import { Button, Dialog as DialogShell, Icon, Well } from 'components';

export interface BlockDialogData {
  readonly block: BlockRow;
}

export type BlockDialogResult =
  | { readonly kind: 'lock'; readonly locked: boolean }
  | { readonly kind: 'swap' }
  | { readonly kind: 'done'; readonly done: boolean };

/**
 * D1 — block details: "Why this", then Swap / Lock. Locked rows add the
 * "Locked" well and offer Unlock; commitments cannot be swapped here and
 * point at Family; errands can be marked done.
 */
@Component({
  selector: 'app-block-dialog',
  standalone: true,
  imports: [Button, DialogShell, Icon, Well],
  templateUrl: './block-dialog.html',
  styleUrl: './block-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockDialog {
  private readonly dialogRef = inject<DialogRef<BlockDialogResult>>(DialogRef);
  protected readonly block = inject<BlockDialogData>(DIALOG_DATA).block;

  protected readonly subtitle = computed(() => {
    const drive = this.block.chips.find((c) => c.icon === 'car')?.label;
    const parts = [`${this.block.day} ${this.block.timeRange}`];
    if (drive) parts.push(drive);
    else if (this.block.subtitle) parts.push(this.block.subtitle);
    return parts.join(' · ');
  });

  protected readonly why = computed(
    () => this.block.reason ?? this.block.subtitle ?? 'Part of the weekend the planner drafted.',
  );

  protected close(): void {
    this.dialogRef.close();
  }

  protected swap(): void {
    this.dialogRef.close({ kind: 'swap' });
  }

  protected toggleLock(): void {
    this.dialogRef.close({ kind: 'lock', locked: !this.block.locked });
  }

  protected toggleDone(): void {
    this.dialogRef.close({ kind: 'done', done: !this.block.done });
  }
}
