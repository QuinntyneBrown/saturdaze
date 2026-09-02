import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { BlockActionDialog } from './block-action-dialog';

async function setup(block: Record<string, unknown>) {
  const mockDialogRef = { close: vi.fn() };
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [BlockActionDialog],
    providers: [
      { provide: DialogRef, useValue: mockDialogRef },
      { provide: DIALOG_DATA, useValue: { block: { id: 'b1', time: '11:00', duration: '2h', day: 'Saturday', title: 'Terre Bleu', icon: 'tree', reason: 'Sunny', ...block } } },
    ],
  }).compileComponents();
  const fixture: ComponentFixture<BlockActionDialog> = TestBed.createComponent(BlockActionDialog);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, mockDialogRef };
}

describe('BlockActionDialog', () => {
  it('shows the reason and offers swap + lock for an unlocked activity', async () => {
    const { fixture, component, mockDialogRef } = await setup({ kind: 'Activity' });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Sunny');
    expect(el.textContent).toContain('Saturday · 11:00 · 2h');
    expect(component['canSwap']).toBe(true);
    component['swap']();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ kind: 'swap' });
    component['toggleLock']();
    expect(mockDialogRef.close).toHaveBeenLastCalledWith({ kind: 'lock', locked: true });
  });

  it('refuses to swap a locked activity and offers unlock', async () => {
    const { component, mockDialogRef } = await setup({ kind: 'Activity', locked: true });
    expect(component['canSwap']).toBe(false);
    expect(component['swapHint']).toMatch(/Unlock/);
    component['swap']();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
    component['toggleLock']();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ kind: 'lock', locked: false });
  });

  it('never offers a lock toggle for commitments', async () => {
    const { fixture, component } = await setup({ kind: 'Commitment', locked: true });
    expect(component['isCommitment']).toBe(true);
    const labels = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('sd-button')).map((b) => b.textContent?.trim());
    expect(labels.some((l) => l?.includes('Unlock') || l?.includes('Lock this block'))).toBe(false);
  });

  it('marks errands done and not done', async () => {
    const { component, mockDialogRef } = await setup({ kind: 'Errand', refId: 'err1', done: false });
    expect(component['isErrand']).toBe(true);
    component['toggleDone']();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ kind: 'done', done: true });
  });

  it('closes on dismiss', async () => {
    const { component, mockDialogRef } = await setup({ kind: 'Meal' });
    component['close']();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });
});
