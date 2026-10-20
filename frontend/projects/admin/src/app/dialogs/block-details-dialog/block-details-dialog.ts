import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { BlockRow } from 'api';
import { Button, Dialog as DialogShell, Icon, Well } from 'components';

export interface BlockDetailsDialogData {
  readonly familyName: string;
  readonly block: BlockRow;
}

export type BlockDetailsDialogResult =
  | { readonly kind: 'lock'; readonly locked: boolean }
  | { readonly kind: 'swap' };

/**
 * AD8 — block details on a family's weekend (docs/mocks/pages/dialogs.html#dialog-admin-block):
 * the planner's reason, then Swap and Lock as the family's D1 offers them (L2-160).
 * Commitments and locked rows explain themselves and offer only what still applies.
 */
@Component({
  selector: 'sd-admin-block-details-dialog',
  standalone: true,
  imports: [Button, DialogShell, Icon, Well],
  templateUrl: './block-details-dialog.html',
  styleUrl: './block-details-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockDetailsDialog {
  private readonly dialogRef = inject<DialogRef<BlockDetailsDialogResult>>(DialogRef);
  protected readonly data = inject<BlockDetailsDialogData>(DIALOG_DATA);
  protected readonly block = this.data.block;

  protected readonly subtitle = computed(() => {
    const parts = [this.data.familyName, `${this.block.day} ${this.block.timeRange}`];
    if (this.block.subtitle) parts.push(this.block.subtitle);
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
}
