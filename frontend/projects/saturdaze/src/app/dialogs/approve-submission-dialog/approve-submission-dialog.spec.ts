import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ApproveSubmissionDialog } from './approve-submission-dialog';

describe('ApproveSubmissionDialog', () => {
  let component: ApproveSubmissionDialog;
  let fixture: ComponentFixture<ApproveSubmissionDialog>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [ApproveSubmissionDialog],
      providers: [
        { provide: DialogRef, useValue: mockDialogRef },
        { provide: DIALOG_DATA, useValue: { submission: {
          id: 's1', title: 'Buskerfest', startsAtLocal: '2026-05-16T14:00', endsAtLocal: null, location: 'Port Credit',
          description: null, costNote: null, ageRange: null, sourceUrl: null, status: 'Pending',
          submittedByUserId: 'u1', submittedByEmail: 'a@b.c', submittedAtUtc: '2026-05-10T10:00:00Z', reviewedAtUtc: null, rejectionReason: null,
        } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApproveSubmissionDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the submission title, date and submitter', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Approve "Buskerfest"?');
    expect(el.textContent).toContain('a@b.c');
    expect(component['whenLabel']).toMatch(/May/);
  });

  it('closes with approve or nothing', () => {
    component['approve']();
    expect(mockDialogRef.close).toHaveBeenCalledWith('approve');
    component['cancel']();
    expect(mockDialogRef.close).toHaveBeenLastCalledWith();
  });
});
