import { vi } from 'vitest';
import { of } from 'rxjs';

import { BLOCK, BLOCK_LOCKED } from '../pages/dialogs/dialog-fixtures';
import { BlockDialog } from '../dialogs/block-dialog/block-dialog';
import { DIALOG_OPTIONS } from '../dialogs/confirm-dialog/confirm-dialog';
import { applyBlockAction, openBlockDialog } from './block-actions';

describe('openBlockDialog', () => {
  it('opens D1 with the block and resolves with what the user chose', async () => {
    const dialog = { open: vi.fn(() => ({ closed: of({ kind: 'swap' }) })) } as any;
    await expect(openBlockDialog(dialog, BLOCK)).resolves.toEqual({ kind: 'swap' });
    expect(dialog.open).toHaveBeenCalledWith(BlockDialog, { ...DIALOG_OPTIONS, data: { block: BLOCK } });
  });

  it('resolves undefined when the dialog is dismissed', async () => {
    const dialog = { open: vi.fn(() => ({ closed: of(undefined) })) } as any;
    await expect(openBlockDialog(dialog, BLOCK)).resolves.toBeUndefined();
  });
});

describe('applyBlockAction', () => {
  const weekend = () => ({
    lockBlock: vi.fn(async () => undefined),
    swapBlock: vi.fn(async () => undefined),
    setErrandDone: vi.fn(async () => undefined),
  });

  it('does nothing without a result', async () => {
    const service = weekend();
    await applyBlockAction(service as any, BLOCK, undefined);
    expect(service.lockBlock).not.toHaveBeenCalled();
    expect(service.swapBlock).not.toHaveBeenCalled();
    expect(service.setErrandDone).not.toHaveBeenCalled();
  });

  it('locks and unlocks the block', async () => {
    const service = weekend();
    await applyBlockAction(service as any, BLOCK, { kind: 'lock', locked: true });
    expect(service.lockBlock).toHaveBeenCalledWith('b-lavender', true);
    await applyBlockAction(service as any, BLOCK_LOCKED, { kind: 'lock', locked: false });
    expect(service.lockBlock).toHaveBeenLastCalledWith('b-bath', false);
  });

  it('swaps by block id', async () => {
    const service = weekend();
    await applyBlockAction(service as any, BLOCK, { kind: 'swap' });
    expect(service.swapBlock).toHaveBeenCalledWith('b-lavender');
  });

  it('marks an errand done through its errand id, and skips rows without one', async () => {
    const service = weekend();
    await applyBlockAction(service as any, { ...BLOCK, errand: true, refId: 'e-costco' }, { kind: 'done', done: true });
    expect(service.setErrandDone).toHaveBeenCalledWith('e-costco', true);
    await applyBlockAction(service as any, { ...BLOCK, errand: true, refId: null }, { kind: 'done', done: false });
    expect(service.setErrandDone).toHaveBeenCalledTimes(1);
  });
});
