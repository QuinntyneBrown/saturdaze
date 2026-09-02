import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { RatingDialog } from './rating-dialog';

describe('RatingDialog', () => {
  let fixture: ComponentFixture<RatingDialog>;
  let component: RatingDialog;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  async function mount(rating: number | null): Promise<void> {
    dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [RatingDialog],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: { eyebrow: '10 – 11 May · Bronte Creek + Rec Room', rating } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RatingDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  const star = (n: number): HTMLButtonElement =>
    host.querySelector(`sd-stars button[aria-label="${n} star${n === 1 ? '' : 's'}"]`) as HTMLButtonElement;
  const caption = (): string => host.querySelector('p.sd-text-sm')?.textContent?.trim() ?? '';

  it('shows the current rating with its caption', async () => {
    await mount(5);
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe('How was it?');
    expect(host.querySelector('.dialog__sub')?.textContent?.trim()).toBe('10 – 11 May · Bronte Creek + Rec Room');
    expect(host.querySelector('sd-stars')?.getAttribute('rating')).toBe('5');
    expect(host.querySelector('sd-stars')?.getAttribute('role')).toBe('radiogroup');
    expect(caption()).toBe('5 of 5, a keeper');
  });

  it('starts unrated with a prompt', async () => {
    await mount(null);
    expect(host.querySelector('sd-stars')?.getAttribute('rating')).toBe('0');
    expect(caption()).toBe('Tap a star to rate it.');
  });

  it('changes the rating from the stars and clears it when the active star is pressed again', async () => {
    await mount(5);
    star(3).click();
    fixture.detectChanges();
    expect(component['rating']()).toBe(3);
    expect(caption()).toBe('3 of 5, fine');

    star(3).click();
    fixture.detectChanges();
    expect(component['rating']()).toBe(0);
    expect(caption()).toBe('Tap a star to rate it.');
  });

  it('saves the rating, or null when cleared', async () => {
    await mount(2);
    component['save']();
    expect(dialogRef.close).toHaveBeenCalledWith({ rating: 2 });
    component['rating'].set(0);
    component['save']();
    expect(dialogRef.close).toHaveBeenLastCalledWith({ rating: null });
  });

  it('closes with nothing on cancel', async () => {
    await mount(4);
    component['cancel']();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
