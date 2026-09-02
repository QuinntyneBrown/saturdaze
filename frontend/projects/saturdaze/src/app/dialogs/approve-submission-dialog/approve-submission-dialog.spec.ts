import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import type { SubmissionCard } from 'api';

import { SUBMISSION_CARD } from '../../pages/dialogs/dialog-fixtures';
import { ApproveSubmissionDialog } from './approve-submission-dialog';

describe('ApproveSubmissionDialog', () => {
  let fixture: ComponentFixture<ApproveSubmissionDialog>;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  async function mount(card: SubmissionCard): Promise<void> {
    dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [ApproveSubmissionDialog],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: { card } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ApproveSubmissionDialog);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  it('names the event and summarises the details with the submitter', async () => {
    await mount(SUBMISSION_CARD);
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe('Approve Port Credit Buskerfest?');
    expect(host.querySelector('.dialog__sub')?.textContent?.trim()).toBe(
      'It becomes visible to every family nearby.',
    );
    expect(host.querySelector('.head__title')?.textContent?.trim()).toBe('Sat 20 Jun · 2:00 to 9:00pm');
    expect(host.querySelector('.head__meta')?.textContent?.trim()).toBe(
      'Memorial Park · Free · All ages · sent by quinntynebrown@gmail.com',
    );
    expect(host.querySelector('sd-date-tile')?.textContent?.replace(/\s+/g, ' ').trim()).toContain('Jun');
  });

  it('leaves out details the submitter skipped', async () => {
    await mount({ ...SUBMISSION_CARD, location: null, cost: null, ages: 'All ages' });
    expect(host.querySelector('.head__meta')?.textContent?.trim()).toBe(
      'All ages · sent by quinntynebrown@gmail.com',
    );
  });

  it('closes with confirm from Approve, or nothing from Cancel', async () => {
    await mount(SUBMISSION_CARD);
    const [cancel, approve] = Array.from(host.querySelectorAll('sd-button[slot="actions"] button'));
    expect(approve!.textContent).toContain('Approve');
    (approve as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith('confirm');
    (cancel as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenLastCalledWith();
  });
});
