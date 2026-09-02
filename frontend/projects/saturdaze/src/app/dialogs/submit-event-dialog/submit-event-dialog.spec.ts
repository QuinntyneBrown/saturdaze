import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogRef } from '@angular/cdk/dialog';

import { EVENT_SUBMISSIONS_SERVICE } from 'api';

import { SUBMISSION } from '../../pages/dialogs/dialog-fixtures';
import { SubmitEventDialog } from './submit-event-dialog';

describe('SubmitEventDialog', () => {
  let fixture: ComponentFixture<SubmitEventDialog>;
  let component: SubmitEventDialog;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let submissions: { submit: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRef = { close: vi.fn() };
    submissions = { submit: vi.fn(async () => SUBMISSION) };
    await TestBed.configureTestingModule({
      imports: [SubmitEventDialog],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: EVENT_SUBMISSIONS_SERVICE, useValue: submissions },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SubmitEventDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  const primary = (): HTMLElement =>
    host.querySelector('sd-button[slot="actions"][variant="primary"]') as HTMLElement;

  it('renders the form with the start time defaulted to the next hour', () => {
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe('Suggest an event');
    const labels = Array.from(host.querySelectorAll('sd-text-input')).map((f) => f.getAttribute('label'));
    expect(labels).toEqual(['Title', 'Starts', 'Ends', 'Location', 'Description', 'Cost', 'Ages', 'Link']);
    expect(component['startsAtLocal']()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:00$/);
    expect(primary().hasAttribute('disabled')).toBe(true);
  });

  it('enables submit once there is a title, and flags a missing start time', () => {
    component['title'].set('Port Credit Buskerfest');
    fixture.detectChanges();
    expect(primary().hasAttribute('disabled')).toBe(false);

    component['startsAtLocal'].set('');
    fixture.detectChanges();
    expect(component['dateError']()).toBe('Pick a start date and time.');
    expect(primary().hasAttribute('disabled')).toBe(true);
  });

  it('submits trimmed values with blanks as null and closes with the created submission', async () => {
    component['title'].set('  Port Credit Buskerfest ');
    component['startsAtLocal'].set('2026-06-20T14:00');
    component['location'].set(' Memorial Park ');
    await component['submit']();
    expect(submissions.submit).toHaveBeenCalledWith({
      title: 'Port Credit Buskerfest',
      startsAtLocal: '2026-06-20T14:00',
      endsAtLocal: null,
      location: 'Memorial Park',
      description: null,
      costNote: null,
      ageRange: null,
      sourceUrl: null,
    });
    expect(dialogRef.close).toHaveBeenCalledWith(SUBMISSION);
  });

  it('keeps the dialog open with an inline error when the API rejects', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    submissions.submit.mockRejectedValueOnce(new Error('500'));
    component['title'].set('Buskerfest');
    await component['submit']();
    expect(component['error']()).toBe('Could not send that. Try again in a moment.');
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component['submitting']()).toBe(false);
    consoleError.mockRestore();
  });

  it('does nothing on submit while invalid, and closes with nothing on cancel', async () => {
    await component['submit']();
    expect(submissions.submit).not.toHaveBeenCalled();
    component['cancel']();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
