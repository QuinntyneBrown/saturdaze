import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { provideRouter } from '@angular/router';

import { CalendarDialog } from './calendar-dialog';

describe('CalendarDialog', () => {
  let fixture: ComponentFixture<CalendarDialog>;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let download: ReturnType<typeof vi.fn>;

  const calendar = {
    icsUrl: 'http://localhost:5100/api/weekends/w1/calendar.ics',
    fileName: 'weekend-17-may.ics',
    eventCount: 10,
  };

  beforeEach(async () => {
    dialogRef = { close: vi.fn() };
    download = vi.fn(async () => new Blob(['BEGIN:VCALENDAR'], { type: 'text/calendar' }));
    await TestBed.configureTestingModule({
      imports: [CalendarDialog],
      providers: [
        provideRouter([]),
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: { calendar, download } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CalendarDialog);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('describes the one file with both days', () => {
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe('Add to your calendar');
    expect(host.querySelector('.dialog__sub')?.textContent?.trim()).toBe(
      'One file with both days.',
    );
    expect(host.querySelector('sd-list-item .list__title')?.textContent?.trim()).toBe(
      'weekend-17-may.ics',
    );
    expect(host.querySelector('sd-list-item .list__sub')?.textContent?.trim()).toBe(
      '10 events · Saturday and Sunday',
    );
  });

  it('fetches the signed-in calendar file, saves it under the shown name and closes', async () => {
    const created = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:calendar');
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const button = host.querySelector(
      'sd-button[slot="actions"] button.btn--primary',
    ) as HTMLButtonElement;
    expect(button.textContent).toContain('Download .ics');

    await fixture.componentInstance['download']();

    expect(download).toHaveBeenCalledTimes(1);
    expect(created).toHaveBeenCalledTimes(1);
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe('weekend-17-may.ics');
    expect(dialogRef.close).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
  });

  it('stays open with a warning when the file cannot be fetched', async () => {
    download.mockRejectedValueOnce(new Error('offline'));
    await fixture.componentInstance['download']();
    fixture.detectChanges();
    expect(host.querySelector('sd-banner')?.textContent).toContain(
      'Could not get the calendar file',
    );
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('closes on cancel', () => {
    fixture.componentInstance['cancel']();
    expect(dialogRef.close).toHaveBeenCalledTimes(1);
  });
});
