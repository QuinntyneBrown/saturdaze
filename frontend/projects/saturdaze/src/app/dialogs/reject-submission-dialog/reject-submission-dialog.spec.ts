import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { RejectSubmissionDialog } from './reject-submission-dialog';

describe('RejectSubmissionDialog', () => {
  let component: RejectSubmissionDialog;
  let fixture: ComponentFixture<RejectSubmissionDialog>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [RejectSubmissionDialog],
      providers: [
        { provide: DialogRef, useValue: mockDialogRef },
        { provide: DIALOG_DATA, useValue: { submission: {
          id: 's1', title: 'Buskerfest', startsAtLocal: '2026-05-16T14:00', endsAtLocal: null, location: null,
          description: null, costNote: null, ageRange: null, sourceUrl: null, status: 'Pending',
          submittedByUserId: 'u1', submittedByEmail: null, submittedAtUtc: '2026-05-10T10:00:00Z', reviewedAtUtc: null, rejectionReason: null,
        } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RejectSubmissionDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the title and a fallback submitter', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('"Buskerfest"');
    expect(el.textContent).toContain('a Saturdaze user');
  });

  it('closes with a trimmed reason, null when blank', () => {
    component['reject']();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ reason: null });
    component['reason'].set('  Duplicate  ');
    component['reject']();
    expect(mockDialogRef.close).toHaveBeenLastCalledWith({ reason: 'Duplicate' });
    component['cancel']();
    expect(mockDialogRef.close).toHaveBeenLastCalledWith();
  });
});
