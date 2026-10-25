import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';

import { CommitmentDialog, CommitmentDialogData } from './commitment-dialog';

describe('CommitmentDialog', () => {
  let fixture: ComponentFixture<CommitmentDialog>;
  let component: CommitmentDialog;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  async function mount(data: CommitmentDialogData): Promise<void> {
    dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [CommitmentDialog],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CommitmentDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  const primary = (): HTMLButtonElement =>
    host.querySelector('sd-button[slot="actions"] button.btn--primary') as HTMLButtonElement;

  it('adds a commitment with Saturday 9 to 10 as the starting point', async () => {
    await mount({ mode: 'add', siblings: [] });
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe('Add a commitment');
    expect(host.querySelector('.dialog__sub')?.textContent?.trim()).toBe(
      'Locked into every weekend.',
    );
    expect(primary().textContent?.trim()).toBe('Add commitment');
    expect(host.querySelector('sd-button[slot="actions-left"]')).toBeNull();
    expect(host.querySelectorAll('sd-seg-radio input[type="radio"]').length).toBe(2);
    expect(component['day']()).toBe('Saturday');
    expect(component['startTime']()).toBe('09:00');
    expect(component['endTime']()).toBe('10:00');
    expect(primary().disabled).toBe(true);

    component['name'].set(' Piano lesson ');
    fixture.detectChanges();
    expect(primary().disabled).toBe(false);
    component['submit']();
    expect(dialogRef.close).toHaveBeenCalledWith({
      kind: 'save',
      title: 'Piano lesson',
      day: 'Saturday',
      startTime: '09:00',
      endTime: '10:00',
      attendeeMemberIds: [],
      where: null,
    });
  });

  it('edits a commitment with Remove on the left', async () => {
    await mount({
      mode: 'edit',
      initial: { title: 'Swim lessons', day: 'Sunday', startTime: '09:00', endTime: '10:00' },
      siblings: [],
    });
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe('Edit Swim lessons');
    expect(primary().textContent?.trim()).toBe('Save');
    expect(component['day']()).toBe('Sunday');
    (host.querySelector('sd-button[slot="actions-left"] button') as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith({ kind: 'remove' });
  });

  it('requires a name and a start before the end', async () => {
    await mount({ mode: 'add', siblings: [] });
    component['submit']();
    expect(component['error']()).toBe('Enter a name.');

    component['name'].set('Church');
    component['startTime'].set('10:30');
    component['endTime'].set('10:30');
    component['submit']();
    expect(component['error']()).toBe('Start time must be before end time.');
    fixture.detectChanges();
    const endField = host.querySelector('input[name="endTime"]')?.closest('sd-text-input');
    expect(endField?.querySelector('.field__error')?.textContent?.trim()).toBe(
      'Start time must be before end time.',
    );
    expect(endField?.querySelector('input')?.getAttribute('aria-invalid')).toBe('true');
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('rejects the same title on the same day as a sibling, but allows the other day', async () => {
    await mount({ mode: 'add', siblings: [{ title: 'Swim lessons', day: 'Saturday' }] });
    component['name'].set('swim LESSONS');
    component['submit']();
    expect(component['error']()).toBe('That commitment is already on that day.');
    expect(dialogRef.close).not.toHaveBeenCalled();

    component['day'].set('Sunday');
    component['submit']();
    expect(dialogRef.close).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'save', title: 'swim LESSONS', day: 'Sunday' }),
    );
  });

  it('keeps a weekday commitment on its stored day (no radio selected, day null)', async () => {
    await mount({
      mode: 'edit',
      initial: { title: 'Piano', day: null, startTime: '16:00', endTime: '17:00' },
      siblings: [],
    });
    expect(component['day']()).toBe('');
    expect(component['canSubmit']()).toBe(true);
    component['submit']();
    expect(dialogRef.close).toHaveBeenCalledWith({
      kind: 'save',
      title: 'Piano',
      day: null,
      startTime: '16:00',
      endTime: '17:00',
      attendeeMemberIds: [],
      where: null,
    });
  });

  it('closes with nothing on cancel', async () => {
    await mount({ mode: 'add', siblings: [] });
    component['cancel']();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });

  describe('who goes and where (L2-192, L2-197)', () => {
    const members = [
      { id: 'm-quinn', name: 'Quinn' },
      { id: 'm-mia', name: 'Mia' },
    ];
    const checkboxes = (): string[] =>
      Array.from(host.querySelectorAll('sd-checkbox')).map((c) => c.textContent?.trim() ?? '');

    it('offers one checkbox per member and saves who goes and where before closing', async () => {
      const save = vi.fn(async () => undefined);
      await mount({ mode: 'add', siblings: [], members, save });
      expect(checkboxes()).toEqual(['Quinn', 'Mia']);

      component['name'].set('Swim');
      component['setGoes']('m-mia', true);
      component['where'].set(' 5980 McLaughlin Rd, Mississauga ');
      await component['submit']();

      const result = expect.objectContaining({
        kind: 'save',
        attendeeMemberIds: ['m-mia'],
        where: '5980 McLaughlin Rd, Mississauga',
      });
      expect(save).toHaveBeenCalledWith(result);
      expect(dialogRef.close).toHaveBeenCalledWith(result);
    });

    it('stays open with the message under Where when the address cannot be found', async () => {
      const refusal = new HttpErrorResponse({
        status: 400,
        error: { errors: { 'Commitments[0].Location': ["We couldn't find that address."] } },
      });
      await mount({
        mode: 'add',
        siblings: [],
        members,
        save: vi.fn(async () => Promise.reject(refusal)),
      });
      component['name'].set('Piano');
      component['where'].set('Nowhere Lane');
      await component['submit']();
      fixture.detectChanges();

      expect(dialogRef.close).not.toHaveBeenCalled();
      expect(host.querySelector('.field__error')?.textContent).toContain(
        "We couldn't find that address.",
      );
    });

    it('starts from the stored attendees and place when editing', async () => {
      await mount({
        mode: 'edit',
        initial: {
          title: 'Swim',
          day: 'Sunday',
          startTime: '16:20',
          endTime: '16:50',
          attendeeMemberIds: ['m-mia'],
          where: '5980 McLaughlin Rd',
        },
        siblings: [],
        members,
      });
      expect(component['goes']('m-mia')).toBe(true);
      expect(component['goes']('m-quinn')).toBe(false);
      expect(component['where']()).toBe('5980 McLaughlin Rd');
    });
  });
});
