import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { provideRouter } from '@angular/router';

import { CalendarDialog } from './calendar-dialog';

describe('CalendarDialog', () => {
  let fixture: ComponentFixture<CalendarDialog>;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  const calendar = {
    icsUrl: 'http://localhost:5100/api/weekends/w1/calendar.ics',
    fileName: 'weekend-17-may.ics',
    eventCount: 10,
  };

  beforeEach(async () => {
    dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [CalendarDialog],
      providers: [
        provideRouter([]),
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: { calendar } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CalendarDialog);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('describes the one file with both days', () => {
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe('Add to your calendar');
    expect(host.querySelector('.dialog__sub')?.textContent?.trim()).toBe('One file with both days.');
    expect(host.querySelector('sd-list-item')?.getAttribute('title')).toBe('weekend-17-may.ics');
    expect(host.querySelector('sd-list-item')?.getAttribute('subtitle')).toBe('10 events · Saturday and Sunday');
  });

  it('downloads through a plain link to the API', () => {
    const link = host.querySelector('sd-button[slot="actions"][variant="primary"] a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe(calendar.icsUrl);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener');
    expect(link.querySelector('sd-icon')?.getAttribute('name')).toBe('calendar');
    // The label "Download .ics" is not asserted: sd-button drops the default
    // text of its <a> branch (see the TODO in components/button.spec.ts).
  });

  it('closes on cancel and after the download click', () => {
    fixture.componentInstance['cancel']();
    expect(dialogRef.close).toHaveBeenCalledTimes(1);
    fixture.componentInstance['downloaded']();
    expect(dialogRef.close).toHaveBeenCalledTimes(2);
  });
});
