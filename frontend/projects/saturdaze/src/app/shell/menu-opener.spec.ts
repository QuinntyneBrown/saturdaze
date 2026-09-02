import { vi } from 'vitest';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';

import { MenuItem } from 'components';

import { MenuDialog } from '../dialogs/menu-dialog/menu-dialog';
import { MenuOpener } from './menu-opener';

const ITEMS: readonly MenuItem[] = [
  { id: 'regenerate', label: 'Regenerate the weekend', icon: 'refresh', sub: 'Locked blocks stay' },
  { id: 'calendar', label: 'Add to calendar', icon: 'calendar' },
];

describe('MenuOpener', () => {
  let breakpoints: { isMatched: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let anchor: HTMLButtonElement;

  beforeEach(() => {
    breakpoints = { isMatched: vi.fn(() => false) };
    dialog = { open: vi.fn(() => ({ closed: of(ITEMS[1]) })) };
    TestBed.configureTestingModule({
      providers: [
        { provide: BreakpointObserver, useValue: breakpoints },
        { provide: Dialog, useValue: dialog },
      ],
    });
    anchor = document.createElement('button');
    document.body.appendChild(anchor);
  });

  afterEach(() => {
    anchor.remove();
    document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove());
  });

  it('opens a bottom sheet below 720px and resolves with the chosen item', async () => {
    const opener = TestBed.inject(MenuOpener);
    const picked = await opener.open(anchor, { title: 'Weekend options', items: ITEMS });
    expect(breakpoints.isMatched).toHaveBeenCalledWith('(min-width: 720px)');
    expect(dialog.open).toHaveBeenCalledWith(
      MenuDialog,
      expect.objectContaining({
        data: { title: 'Weekend options', items: ITEMS },
        panelClass: 'sd-dialog-panel',
        backdropClass: 'sd-dialog-backdrop',
      }),
    );
    expect(picked).toBe(ITEMS[1]);
  });

  it('exposes its Dialog so callers can chain a confirmation', () => {
    expect(TestBed.inject(MenuOpener).dialog).toBe(dialog);
  });

  it('anchors a popover from 720px and resolves when an item is picked', async () => {
    breakpoints.isMatched.mockReturnValue(true);
    const opener = TestBed.inject(MenuOpener);
    const pending = opener.open(anchor, { title: 'Account', header: 'q@x.com', items: ITEMS });
    TestBed.inject(ApplicationRef).tick();

    const pane = document.querySelector('.sd-menu-pane');
    expect(pane).not.toBeNull();
    expect(pane?.querySelector('.menu__header')?.textContent?.trim()).toBe('q@x.com');
    expect(pane?.querySelector('sd-menu')?.getAttribute('aria-label')).toBe('Account');
    const items = pane!.querySelectorAll<HTMLElement>('[role="menuitem"]');
    expect(items.length).toBe(2);
    items[0]!.click();

    await expect(pending).resolves.toBe(ITEMS[0]);
    expect(document.querySelector('.sd-menu-pane')).toBeNull();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('resolves with nothing when the popover backdrop is clicked', async () => {
    breakpoints.isMatched.mockReturnValue(true);
    const opener = TestBed.inject(MenuOpener);
    const pending = opener.open(anchor, { title: 'Account', items: ITEMS });
    TestBed.inject(ApplicationRef).tick();

    const backdrop = document.querySelector<HTMLElement>('.sd-menu-backdrop');
    expect(backdrop).not.toBeNull();
    backdrop!.click();
    await expect(pending).resolves.toBeUndefined();
  });
});
