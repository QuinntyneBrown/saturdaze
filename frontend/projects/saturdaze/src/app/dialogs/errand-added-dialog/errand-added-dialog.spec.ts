import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { ErrandAddedDialog } from './errand-added-dialog';

describe('ErrandAddedDialog', () => {
  let fixture: ComponentFixture<ErrandAddedDialog>;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [ErrandAddedDialog],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        {
          provide: DIALOG_DATA,
          useValue: {
            placement: {
              description: 'Costco run',
              day: 'Sunday',
              time: '9:15',
              endTime: '10:00',
              blockId: 'b-costco',
            },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ErrandAddedDialog);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('says where the planner put the errand', () => {
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe('Added to Sunday at 9:15');
    expect(host.querySelector('.dialog__sub')?.textContent?.trim()).toBe(
      'It sits around what was already planned.',
    );
    const rows = Array.from(host.querySelectorAll('sd-list-item'));
    expect(rows.map((r) => r.getAttribute('title'))).toEqual(['Costco run', 'Sunday · 9:15 to 10:00']);
    expect(rows.map((r) => r.getAttribute('subtitle'))).toEqual(['What', 'When']);
  });

  it('closes on Done', () => {
    (host.querySelector('sd-button[slot="actions"] button') as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
