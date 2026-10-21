import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { CalendarFeedDialog } from './calendar-feed-dialog';

describe('CalendarFeedDialog', () => {
  let fixture: ComponentFixture<CalendarFeedDialog>;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [CalendarFeedDialog],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        {
          provide: DIALOG_DATA,
          useValue: { webcalUrl: 'webcal://api.example.com/api/calendar/feed/abc.ics' },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CalendarFeedDialog);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  function action(label: string): HTMLButtonElement {
    return Array.from(host.querySelectorAll<HTMLButtonElement>('.dialog__actions button')).find(
      (b) => b.textContent?.trim() === label,
    )!;
  }

  it('shows the link once, with the steps for three calendar apps', () => {
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe(
      'Subscribe from another calendar',
    );
    expect(host.querySelector('.copy-field__value')?.textContent?.trim()).toBe(
      'webcal://api.example.com/api/calendar/feed/abc.ics',
    );
    const apps = Array.from(host.querySelectorAll('.list__title')).map((e) =>
      e.textContent?.trim(),
    );
    expect(apps).toEqual(['Apple Calendar', 'Outlook', 'Google Calendar']);
  });

  it('closes with nothing on Done and with "stop" on Stop the link', () => {
    action('Done').click();
    expect(dialogRef.close).toHaveBeenLastCalledWith();
    action('Stop the link').click();
    expect(dialogRef.close).toHaveBeenLastCalledWith('stop');
  });
});
