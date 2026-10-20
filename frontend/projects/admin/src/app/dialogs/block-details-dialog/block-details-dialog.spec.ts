import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { BlockRow } from 'api';

import { BlockDetailsDialog, BlockDetailsDialogData } from './block-details-dialog';

// Traces to: L2-160
describe('BlockDetailsDialog (AD8)', () => {
  const block = (overrides: Partial<BlockRow>): BlockRow => ({
    id: 'b1',
    day: 'Saturday',
    kind: 'Activity',
    refId: 'a1',
    time: '11:00am',
    startMinutes: 660,
    timeRange: '11:00am to 12:45pm',
    duration: '1h 45m',
    durationMinutes: 105,
    icon: 'tree',
    title: 'Lavender fields',
    subtitle: 'Terre Bleu, Milton',
    reason: 'Saturday is the sunny day.',
    chips: [],
    locked: false,
    commitment: false,
    errand: false,
    done: false,
    drive: false,
    highlight: true,
    swappable: true,
    lockable: true,
    stopNumber: 2,
    leg: null,
    ...overrides,
  });

  function render(data: BlockDetailsDialogData) {
    const ref = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [BlockDetailsDialog],
      providers: [
        { provide: DialogRef, useValue: ref },
        { provide: DIALOG_DATA, useValue: data },
      ],
    });
    const fixture = TestBed.createComponent(BlockDetailsDialog);
    fixture.detectChanges();
    return { host: fixture.nativeElement as HTMLElement, ref };
  }

  it('names the family and the slot, explains the pick, and offers Swap and Lock', () => {
    const { host, ref } = render({ familyName: 'The Browns', block: block({}) });
    expect(host.querySelector('.dialog__sub')?.textContent?.trim()).toBe(
      'The Browns · Saturday 11:00am to 12:45pm · Terre Bleu, Milton',
    );
    expect(host.querySelector('.well__body')?.textContent?.trim()).toBe(
      'Saturday is the sunny day.',
    );
    const buttons = Array.from(host.querySelectorAll('.dialog__actions button'));
    expect(buttons.map((b) => b.textContent?.trim())).toEqual([
      'Swap for something else',
      'Lock this block',
    ]);
    (buttons[1] as HTMLButtonElement).click();
    expect(ref.close).toHaveBeenCalledWith({ kind: 'lock', locked: true });
  });

  it('offers only Close for a commitment', () => {
    const { host } = render({
      familyName: 'The Browns',
      block: block({ commitment: true, swappable: false, lockable: false, locked: true }),
    });
    expect(host.querySelector('.well__title')?.textContent?.trim()).toBe('A recurring commitment');
    const buttons = Array.from(host.querySelectorAll('.dialog__actions button'));
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Close']);
  });
});
