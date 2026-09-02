import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { MORE_ITEMS } from '../../pages/dialogs/dialog-fixtures';
import { MenuDialog } from './menu-dialog';

describe('MenuDialog', () => {
  let fixture: ComponentFixture<MenuDialog>;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [MenuDialog],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: { title: 'Weekend options', items: MORE_ITEMS } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MenuDialog);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders the items as a bottom-sheet menu', () => {
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe('Weekend options');
    const menu = host.querySelector('sd-menu');
    expect(menu?.hasAttribute('sheet')).toBe(true);
    expect(menu?.getAttribute('aria-label')).toBe('Weekend options');
    const items = Array.from(host.querySelectorAll('[role="menuitem"]'));
    expect(items.map((i) => i.querySelector('.menu__label')?.textContent?.trim())).toEqual([
      'Regenerate the weekend',
      'Add to calendar',
    ]);
    expect(items[0]!.querySelector('.menu__sub')?.textContent?.trim()).toBe('Locked blocks stay where they are');
  });

  it('closes with the chosen item', () => {
    (host.querySelectorAll('[role="menuitem"]')[1] as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith(MORE_ITEMS[1]);
  });

  it('closes with nothing from the Close button', () => {
    (host.querySelector('sd-button[slot="actions"] button') as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
