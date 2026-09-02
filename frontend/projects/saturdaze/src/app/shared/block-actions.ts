import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';

import type { Block, IWeekendPlanService } from 'api';

import {
  BlockActionDialog,
  BlockActionDialogData,
  BlockActionDialogResult,
} from '../dialogs/block-action-dialog/block-action-dialog';

/**
 * Open the block-action sheet for a timeline block and resolve with what
 * the user chose (or `undefined` when dismissed).
 */
export async function openBlockActions(
  dialog: Dialog,
  block: Block,
): Promise<BlockActionDialogResult | undefined> {
  const ref = dialog.open<BlockActionDialogResult, BlockActionDialogData>(
    BlockActionDialog,
    { data: { block }, autoFocus: 'first-tabbable', restoreFocus: true },
  );
  return await firstValueFrom(ref.closed);
}

/**
 * Apply a block-action result against the weekend service. Shared by the
 * home preview pane and the itinerary timeline so both behave identically.
 */
export async function applyBlockAction(
  weekend: IWeekendPlanService,
  block: Block,
  result: BlockActionDialogResult | undefined,
): Promise<void> {
  if (!result || !block.id) return;
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

/** Google Maps search URL for a place name. */
export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
