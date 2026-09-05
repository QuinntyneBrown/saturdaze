import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { FOOD_CARD } from '../../pages/dialogs/dialog-fixtures';
import { LockRestaurantDialog } from './lock-restaurant-dialog';

describe('LockRestaurantDialog', () => {
  let fixture: ComponentFixture<LockRestaurantDialog>;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [LockRestaurantDialog],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: { card: FOOD_CARD, day: 'Saturday', slot: 'Lunch' } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LockRestaurantDialog);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('asks about the restaurant, day and meal', () => {
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe(
      'Lock La Marina for Saturday lunch?',
    );
    expect(host.querySelector('.dialog__sub')?.textContent?.trim()).toBe(
      'It goes on the timeline and other picks step back.',
    );
    expect(host.querySelector('.head__title')?.textContent?.trim()).toBe('La Marina');
    expect(host.querySelector('.head__meta')?.textContent?.trim()).toBe(FOOD_CARD.meta);
  });

  it('renders the card chips with their tones', () => {
    const chips = Array.from(host.querySelectorAll('sd-chip'));
    expect(chips.map((c) => c.textContent?.trim())).toEqual(['Wife-approved', '3 of 4 yes']);
    expect(chips.map((c) => c.getAttribute('tone'))).toEqual(['accent', 'leaf']);
    expect(chips[0]!.querySelector('sd-icon')?.getAttribute('name')).toBe('heart');
  });

  it('closes with confirm from "Lock it in", or with nothing from "Not yet"', () => {
    const [notYet, lockIt] = Array.from(host.querySelectorAll('sd-button[slot="actions"] button'));
    expect(notYet!.textContent?.trim()).toBe('Not yet');
    expect(lockIt!.textContent).toContain('Lock it in');
    (lockIt as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith('confirm');
    (notYet as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenLastCalledWith();
  });
});
