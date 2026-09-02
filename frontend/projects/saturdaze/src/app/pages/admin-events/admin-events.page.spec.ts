import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import { EVENT_SUBMISSIONS_SERVICE, type EventSubmissionDto } from 'api';
import { AdminEventsPage } from './admin-events.page';

const submission: EventSubmissionDto = {
  id: 's1', title: 'Buskerfest', startsAtLocal: '2026-05-16T14:00', endsAtLocal: null, location: 'Port Credit',
  description: 'Fun', costNote: 'Free', ageRange: 'All ages', sourceUrl: 'https://example.com', status: 'Pending',
  submittedByUserId: 'u1', submittedByEmail: 'a@b.c', submittedAtUtc: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  reviewedAtUtc: null, rejectionReason: null,
};

describe('AdminEventsPage', () => {
  let component: AdminEventsPage;
  let fixture: ComponentFixture<AdminEventsPage>;
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let submissions: any;
  const pending = signal<EventSubmissionDto[]>([submission]);

  beforeEach(async () => {
    pending.set([submission]);
    mockDialog = { open: vi.fn(() => ({ closed: of('approve') })) };
    submissions = {
      pending: () => pending,
      loadPending: vi.fn(() => Promise.resolve()),
      approve: vi.fn(() => Promise.resolve()),
      reject: vi.fn(() => Promise.resolve()),
    };

    await TestBed.configureTestingModule({
      imports: [AdminEventsPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: EVENT_SUBMISSIONS_SERVICE, useValue: submissions },
        { provide: Dialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEventsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the queue on init and renders one submission with a styled link', () => {
    expect(submissions.loadPending).toHaveBeenCalled();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('article.submission')).toHaveLength(1);
    expect(el.textContent).toContain('1 in queue');
    expect(el.textContent).not.toContain('oldest first');
    const link = el.querySelector('.actions a.link-button') as HTMLAnchorElement;
    expect(link.href).toBe('https://example.com/');
    expect(link.closest('sd-button')).toBeNull();
  });

  it('formats dates with the shared helpers', () => {
    expect(component['formatWhen']('2026-05-16T14:00')).toMatch(/2026/);
    expect(component['submittedAgo'](submission.submittedAtUtc)).toBe('3 hours ago');
  });

  it('approves after the dialog confirms', async () => {
    await component['openApprove'](submission);
    expect(submissions.approve).toHaveBeenCalledWith('s1');
  });

  it('rejects with the dialog reason and does nothing on dismiss', async () => {
    mockDialog.open = vi.fn(() => ({ closed: of({ reason: 'Duplicate' }) }));
    await component['openReject'](submission);
    expect(submissions.reject).toHaveBeenCalledWith('s1', 'Duplicate');
    mockDialog.open = vi.fn(() => ({ closed: of(undefined) }));
    await component['openReject'](submission);
    expect(submissions.reject).toHaveBeenCalledTimes(1);
  });

  it('shows the empty message when the queue is clear', () => {
    pending.set([]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Nothing to review right now.');
  });
});
