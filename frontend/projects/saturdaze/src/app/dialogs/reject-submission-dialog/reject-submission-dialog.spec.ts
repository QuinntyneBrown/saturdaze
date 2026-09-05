import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { SUBMISSION_CARD } from '../../pages/dialogs/dialog-fixtures';
import { RejectSubmissionDialog } from './reject-submission-dialog';

describe('RejectSubmissionDialog', () => {
  let fixture: ComponentFixture<RejectSubmissionDialog>;
  let component: RejectSubmissionDialog;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [RejectSubmissionDialog],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: { card: SUBMISSION_CARD } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RejectSubmissionDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('asks for an optional reason with a danger Reject button', () => {
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe('Reject this suggestion?');
    expect(host.querySelector('.dialog__sub')?.textContent?.trim()).toBe(
      'The reason is shown to the person who sent it.',
    );
    const field = host.querySelector('sd-text-input');
    expect(field?.getAttribute('label')).toBe('Reason');
    expect(field?.hasAttribute('multiline')).toBe(true);
    expect(field?.getAttribute('hint')).toBe('Optional.');
    const reject = host.querySelector('sd-button[slot="actions"][variant="danger"]');
    expect(reject?.textContent).toContain('Reject');
  });

  it('closes with the trimmed reason, or an empty one', () => {
    component['reason'].set('  Already listed. ');
    component['reject']();
    expect(dialogRef.close).toHaveBeenCalledWith({ reason: 'Already listed.' });

    component['reason'].set('');
    (host.querySelector('sd-button[slot="actions"][variant="danger"] button') as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenLastCalledWith({ reason: '' });
  });

  it('closes with nothing on cancel', () => {
    (host.querySelector('sd-button[slot="actions"][variant="quiet"] button') as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
