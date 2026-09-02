import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { provideRouter } from '@angular/router';

import type { BlockRow } from 'api';

import { BLOCK, BLOCK_COMMITMENT, BLOCK_LOCKED } from '../../pages/dialogs/dialog-fixtures';
import { BlockDialog } from './block-dialog';

describe('BlockDialog', () => {
  let fixture: ComponentFixture<BlockDialog>;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  async function mount(block: BlockRow): Promise<void> {
    dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [BlockDialog],
      providers: [
        provideRouter([]),
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: { block } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(BlockDialog);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  const text = (el: Element | null): string => el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const actions = (): string[] => Array.from(host.querySelectorAll('sd-button[slot]')).map(text);
  const wells = (): string[] =>
    Array.from(host.querySelectorAll('sd-well')).map((w) => w.getAttribute('title') ?? '');

  it('renders an activity block with the drive chip in the subtitle and Swap / Lock actions', async () => {
    await mount(BLOCK);
    expect(text(host.querySelector('.dialog__title'))).toBe('Terre Bleu Lavender Farm');
    expect(text(host.querySelector('.dialog__sub'))).toBe('Saturday 11:00 to 1:00 · 45 min drive');
    expect(wells()).toEqual(['Why this']);
    expect(text(host.querySelector('sd-well'))).toContain('Lavender peaks 17 to 24 May');
    expect(actions()).toEqual(['Swap for something else', 'Lock this block']);
  });

  it('closes with swap or a lock toggle', async () => {
    await mount(BLOCK);
    (host.querySelector('sd-button[slot="actions"][variant="quiet"] button') as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith({ kind: 'swap' });
    (host.querySelector('sd-button[slot="actions"][variant="primary"] button') as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenLastCalledWith({ kind: 'lock', locked: true });
  });

  it('explains a locked block and offers Unlock', async () => {
    await mount(BLOCK_LOCKED);
    expect(text(host.querySelector('.dialog__sub'))).toBe('Saturday 8:00 to 9:00pm · Lights out at 9');
    expect(wells()).toEqual(['Locked', 'Why this']);
    expect(actions()).toContain('Unlock');
    fixture.componentInstance['toggleLock']();
    expect(dialogRef.close).toHaveBeenCalledWith({ kind: 'lock', locked: false });
  });

  it('points a commitment at Family and only offers Close', async () => {
    await mount(BLOCK_COMMITMENT);
    expect(wells()).toEqual(['A recurring commitment']);
    const buttons = Array.from(host.querySelectorAll('sd-button[slot="actions"]'));
    expect(buttons.length).toBe(2);
    // The Family link is an anchor button; sd-button currently drops the default
    // text of its <a> branch (see the TODO in components/button.spec.ts), so only
    // the href is asserted here.
    expect(buttons[0]?.querySelector('a')?.getAttribute('href')).toBe('/family');
    expect(text(buttons[1]!)).toBe('Close');
    expect(host.querySelector('sd-button[slot="actions"] button[type="button"]')).not.toBeNull();
    (buttons[1]!.querySelector('button') as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });

  it('lets an errand be marked done', async () => {
    await mount({ ...BLOCK, kind: 'Errand', errand: true, refId: 'e-costco', done: false, swappable: false });
    expect(actions()).toEqual(['Mark done', 'Lock this block']);
    (host.querySelector('sd-button[slot="actions-left"] button') as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith({ kind: 'done', done: true });
  });

  it('falls back to a generic "why" when the planner gave no reason', async () => {
    await mount({ ...BLOCK, reason: null, subtitle: null, chips: [] });
    expect(text(host.querySelector('.dialog__sub'))).toBe('Saturday 11:00 to 1:00');
    expect(text(host.querySelector('sd-well'))).toContain('Part of the weekend the planner drafted.');
  });
});
