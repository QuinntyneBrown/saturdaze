import { vi } from 'vitest';
import { of } from 'rxjs';

import { applyBlockAction, mapsSearchUrl, openBlockActions } from './block-actions';

describe('block-actions', () => {
  const weekend = () => ({
    lockBlock: vi.fn(() => Promise.resolve()),
    swapBlock: vi.fn(() => Promise.resolve()),
    setErrandDone: vi.fn(() => Promise.resolve()),
  }) as any;

  it('dispatches lock, swap and done to the weekend service', async () => {
    const svc = weekend();
    const block = { id: 'b1', refId: 'err1', kind: 'Errand', time: '9:00', title: 'Costco', icon: 'bag' } as any;
    await applyBlockAction(svc, block, { kind: 'lock', locked: true });
    expect(svc.lockBlock).toHaveBeenCalledWith('b1', true);
    await applyBlockAction(svc, block, { kind: 'swap' });
    expect(svc.swapBlock).toHaveBeenCalledWith('b1');
    await applyBlockAction(svc, block, { kind: 'done', done: true });
    expect(svc.setErrandDone).toHaveBeenCalledWith('err1', true);
  });

  it('ignores dismissals, blocks without ids and errands without a refId', async () => {
    const svc = weekend();
    await applyBlockAction(svc, { id: 'b1', time: '', title: '', icon: '' } as any, undefined);
    await applyBlockAction(svc, { time: '', title: '', icon: '' } as any, { kind: 'lock', locked: true });
    await applyBlockAction(svc, { id: 'b1', kind: 'Errand', time: '', title: '', icon: '' } as any, { kind: 'done', done: true });
    expect(svc.lockBlock).not.toHaveBeenCalled();
    expect(svc.setErrandDone).not.toHaveBeenCalled();
  });

  it('opens the block sheet and resolves with the chosen action', async () => {
    const dialog = { open: vi.fn(() => ({ closed: of({ kind: 'swap' }) })) } as any;
    const block = { id: 'b1', time: '', title: 'X', icon: '' } as any;
    const result = await openBlockActions(dialog, block);
    expect(result).toEqual({ kind: 'swap' });
    expect(dialog.open.mock.calls[0][1].data).toEqual({ block });
  });

  it('builds a Google Maps search URL', () => {
    expect(mapsSearchUrl('Terre Bleu Lavender Farm')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Terre%20Bleu%20Lavender%20Farm',
    );
  });
});
