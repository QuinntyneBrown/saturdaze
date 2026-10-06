import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogRef } from '@angular/cdk/dialog';

import { ErrandPlacement, WEEKEND_PLAN_SERVICE } from 'api';

import { AddErrandDialog } from './add-errand-dialog';

const PLACEMENT: ErrandPlacement = {
  description: 'Costco run',
  day: 'Sunday',
  time: '9:15',
  endTime: '10:00',
  blockId: 'b-costco',
};

describe('AddErrandDialog', () => {
  let fixture: ComponentFixture<AddErrandDialog>;
  let component: AddErrandDialog;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let weekend: { addErrand: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRef = { close: vi.fn() };
    weekend = { addErrand: vi.fn(async () => PLACEMENT) };
    await TestBed.configureTestingModule({
      imports: [AddErrandDialog],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: WEEKEND_PLAN_SERVICE, useValue: weekend },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AddErrandDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  const primary = (): HTMLButtonElement =>
    host.querySelector('sd-button[slot="actions"] button.btn--primary') as HTMLButtonElement;
  const labelOf = (field: string): string | undefined =>
    host.querySelector(`${field} .field__label`)?.firstChild?.textContent?.trim();

  it('renders the three fields and keeps the primary disabled until there is a description', () => {
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe('Add an errand');
    expect(labelOf('sd-text-input')).toBe('What is it');
    expect(labelOf('sd-select')).toBe('Roughly how long');
    expect(labelOf('sd-seg-radio')).toBe('Which day');
    expect(host.querySelectorAll('sd-seg-radio input[type="radio"]').length).toBe(3);
    expect(primary().disabled).toBe(true);

    component['description'].set('Costco run');
    fixture.detectChanges();
    expect(primary().disabled).toBe(false);
  });

  it('ignores submit while the description is blank', async () => {
    await component['submit']();
    expect(weekend.addErrand).not.toHaveBeenCalled();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('adds the errand with the defaults (45 minutes, either day) and closes with the placement', async () => {
    component['description'].set('  Costco run ');
    await component['submit']();
    expect(weekend.addErrand).toHaveBeenCalledWith('Costco run', 45, null);
    expect(dialogRef.close).toHaveBeenCalledWith(PLACEMENT);
  });

  it('passes the chosen duration and day through', async () => {
    component['description'].set('Library books');
    component['minutes'].set('30');
    component['day'].set('Saturday');
    await component['submit']();
    expect(weekend.addErrand).toHaveBeenCalledWith('Library books', 30, 'Saturday');
  });

  it('shows an inline error and stays open when the planner rejects', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    weekend.addErrand.mockRejectedValueOnce(new Error('boom'));
    component['description'].set('Costco run');
    await component['submit']();
    fixture.detectChanges();
    expect(component['error']()).toBe('Could not add that. Try again in a moment.');
    expect(host.querySelector('sd-text-input .field__error')?.textContent?.trim()).toBe(
      'Could not add that. Try again in a moment.',
    );
    expect(host.querySelector('sd-text-input input')?.getAttribute('aria-invalid')).toBe('true');
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component['submitting']()).toBe(false);
    consoleError.mockRestore();
  });

  it('closes with nothing on cancel', () => {
    (
      host.querySelector('sd-button[slot="actions"] button.btn--quiet') as HTMLButtonElement
    ).click();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
