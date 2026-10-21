import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { ConnectCalendarDialog } from './connect-calendar-dialog';

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('ConnectCalendarDialog', () => {
  let fixture: ComponentFixture<ConnectCalendarDialog>;
  let host: HTMLElement;
  let start: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    start = vi.fn(async () => undefined);
    await TestBed.configureTestingModule({
      imports: [ConnectCalendarDialog],
      providers: [
        { provide: DialogRef, useValue: { close: vi.fn() } },
        { provide: DIALOG_DATA, useValue: { start } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ConnectCalendarDialog);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  const primary = (): HTMLButtonElement =>
    Array.from(host.querySelectorAll<HTMLButtonElement>('.dialog__actions button')).at(-1)!;

  it('says what Saturdaze writes and reads before Google asks', () => {
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe(
      'Connect Google Calendar',
    );
    const titles = Array.from(host.querySelectorAll('.list__title')).map((e) =>
      e.textContent?.trim(),
    );
    expect(titles).toEqual([
      'Saturdaze writes this weekend',
      'Saturdaze reads this weekend',
      'Nothing else',
    ]);
    expect(primary().textContent?.trim()).toBe('Continue to Google');
  });

  it('shows the error state and offers Try again when the start fails', async () => {
    start.mockRejectedValueOnce(new Error('503'));
    primary().click();
    await settle();
    fixture.detectChanges();
    expect(host.querySelector('sd-banner')?.textContent?.trim()).toBe(
      "Google didn't answer. Nothing was connected. Try again in a minute.",
    );
    expect(primary().textContent?.trim()).toBe('Try again');
  });
});
