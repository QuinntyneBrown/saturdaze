import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';

import type { BlockRow, IWeekendPlanService } from 'api';

import { BlockDialog, BlockDialogData, BlockDialogResult } from '../dialogs/block-dialog/block-dialog';
import { DIALOG_OPTIONS } from '../dialogs/confirm-dialog/confirm-dialog';

/**
 * Open the block details dialog (D1) for a timeline row and resolve with
 * what the user chose, or `undefined` when dismissed.
 */
export async function openBlockDialog(
  dialog: Dialog,
  block: BlockRow,
): Promise<BlockDialogResult | undefined> {
  const ref = dialog.open<BlockDialogResult, BlockDialogData>(BlockDialog, {
    ...DIALOG_OPTIONS,
    data: { block },
  });
  return await firstValueFrom(ref.closed);
}

/**
 * Apply a block action against the weekend service. The Weekend page's row
 * buttons and the block dialog's buttons both go through here.
 */
export async function applyBlockAction(
  weekend: IWeekendPlanService,
  block: BlockRow,
  result: BlockDialogResult | undefined,
): Promise<void> {
  if (!result) return;
  switch (result.kind) {
    case 'lock':
      await weekend.lockBlock(block.id, result.locked);
      return;
    case 'swap':
      await weekend.swapBlock(block.id);
      return;
    case 'done':
      if (block.refId) await weekend.setErrandDone(block.refId, result.done);
      return;
  }
}
