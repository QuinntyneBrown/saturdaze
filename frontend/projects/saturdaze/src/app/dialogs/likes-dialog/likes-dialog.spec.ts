import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { DISLIKES, LIKES } from '../../pages/dialogs/dialog-fixtures';
import { LikesDialog } from './likes-dialog';

/** Flush every pending microtask (the app is zoneless, so whenStable cannot see mocked promises). */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('LikesDialog', () => {
  let fixture: ComponentFixture<LikesDialog>;
  let component: LikesDialog;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [LikesDialog],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: { likes: LIKES, dislikes: DISLIKES } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LikesDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders two tag editors seeded with the family likes and dislikes', () => {
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe('Likes and dislikes');
    const inputs = Array.from(host.querySelectorAll('sd-chip-input'));
    expect(inputs.map((i) => i.getAttribute('label'))).toEqual(['Likes', 'Dislikes']);
    expect(inputs.map((i) => i.getAttribute('tone'))).toEqual(['leaf', 'warn']);
    const chips = (i: number): string[] =>
      Array.from(inputs[i]!.querySelectorAll('sd-chip')).map((c) => c.textContent?.trim() ?? '');
    expect(chips(0)).toEqual([...LIKES]);
    expect(chips(1)).toEqual([...DISLIKES]);
  });

  it('works on copies so cancelling leaves the input data alone', () => {
    component['likes'].update((l) => [...l, 'Beaches']);
    expect(LIKES).not.toContain('Beaches');
    component['cancel']();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });

  it('saves both lists', () => {
    component['likes'].set(['Parks']);
    component['dislikes'].set(['Camping', 'Long drives']);
    (host.querySelector('sd-button[slot="actions"][variant="primary"] button') as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith({ likes: ['Parks'], dislikes: ['Camping', 'Long drives'] });
  });
});
