import { vi } from 'vitest';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { EVENT_SUBMISSIONS_SERVICE, ReviewView } from 'api';

import { ApproveSubmissionDialog } from '../../dialogs/approve-submission-dialog/approve-submission-dialog';
import { RejectSubmissionDialog } from '../../dialogs/reject-submission-dialog/reject-submission-dialog';
import { SUBMISSION_CARD } from '../dialogs/dialog-fixtures';
import { ReviewSubmissionsPage } from './review-submissions.page';

const LOADING: ReviewView = { status: 'loading', subtitle: '', cards: [] };

const READY: ReviewView = {
  status: 'ready',
  subtitle: 'Two waiting, oldest first. Approving publishes to every family nearby.',
  cards: [
    SUBMISSION_CARD,
    {
      ...SUBMISSION_CARD,
      id: 's-market',
      title: 'Farmers Market',
      when: 'Sun 21 Jun · 9:00 to 1:00',
      location: null,
      cost: null,
      ages: null,
      link: null,
      notes: null,
      dto: { ...SUBMISSION_CARD.dto, id: 's-market', sourceUrl: null },
    },
  ],
};

/** Flush every pending microtask (the app is zoneless, so whenStable cannot see mocked promises). */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('ReviewSubmissionsPage', () => {
  let fixture: ComponentFixture<ReviewSubmissionsPage>;
  let component: ReviewSubmissionsPage;
  let host: HTMLElement;
  let view: ReturnType<typeof signal<ReviewView>>;
  let submissions: any;
  let dialog: { open: ReturnType<typeof vi.fn> };

  async function mount(query: Record<string, string> = {}): Promise<void> {
    const queryParamMap = convertToParamMap(query);
    await TestBed.configureTestingModule({
      imports: [ReviewSubmissionsPage],
      providers: [
        provideRouter([]),
        { provide: EVENT_SUBMISSIONS_SERVICE, useValue: submissions },
        { provide: Dialog, useValue: dialog },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({}), queryParamMap, params: {}, queryParams: query, data: {}, fragment: null },
            paramMap: of(convertToParamMap({})),
            queryParamMap: of(queryParamMap),
            params: of({}),
            queryParams: of(query),
            data: of({}),
            fragment: of(null),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ReviewSubmissionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    view = signal<ReviewView>(LOADING);
    submissions = {
      review: () => view,
      loadPending: vi.fn(async () => view.set(READY)),
      approve: vi.fn(async () => SUBMISSION_CARD.dto),
      reject: vi.fn(async () => SUBMISSION_CARD.dto),
    };
    dialog = { open: vi.fn(() => ({ closed: of(undefined) })) };
  });

  const header = (): Element => host.querySelector('sd-page-header')!;
  const cards = (): HTMLElement[] => Array.from(host.querySelectorAll('sd-card.submission'));

  it('fetches the queue and renders each pending card, oldest first', async () => {
    submissions.loadPending.mockImplementationOnce(() => new Promise<void>(() => undefined));
    await mount();
    expect(submissions.loadPending).toHaveBeenCalledTimes(1);
    expect(header().getAttribute('title')).toBe('Review submissions');
    expect(host.querySelector('.page-header__eyebrow')?.getAttribute('href')).toBe('/family');
    expect(host.querySelector('sd-status-row')?.textContent?.trim()).toBe('Fetching the queue.');

    view.set(READY);
    fixture.detectChanges();
    expect(header().getAttribute('subtitle')).toBe(READY.subtitle);
    expect(cards().map((c) => c.getAttribute('aria-label'))).toEqual(['Port Credit Buskerfest', 'Farmers Market']);
    const first = cards()[0]!;
    expect(first.querySelector('.head__meta')?.textContent?.trim()).toBe('Sat 20 Jun · 2:00 to 9:00pm');
    expect(first.querySelector('sd-chip')?.textContent?.trim()).toBe('Pending');
    expect(first.querySelector('.submitter sd-avatar')?.getAttribute('name')).toBe('quinntynebrown@gmail.com');
    expect(first.querySelector('.submitter')?.textContent?.replace(/\s+/g, ' ').trim()).toContain(
      'quinntynebrown@gmail.com · 2 hours ago',
    );
    const details = Array.from(first.querySelectorAll('dt')).map((d) => d.textContent?.trim());
    expect(details).toEqual(['Location', 'Cost', 'Ages', 'Link', 'Notes']);
    expect(first.querySelector('.details__link')?.getAttribute('href')).toBe(SUBMISSION_CARD.dto.sourceUrl);
    expect(cards()[1]!.querySelectorAll('.details__value--faint').length).toBe(5);
  });

  it('shows the cleared queue for ?state=empty without fetching', async () => {
    await mount({ state: 'empty' });
    expect(submissions.loadPending).not.toHaveBeenCalled();
    expect(header().getAttribute('subtitle')).toBe(
      'Nothing waiting. New suggestions show up here as families send them.',
    );
    expect(host.querySelector('sd-empty')?.getAttribute('title')).toBe('Queue is clear');
    expect(host.querySelector('sd-empty sd-button a')?.getAttribute('href')).toBe('/family');
  });

  it('shows the cleared queue when the API has nothing pending', async () => {
    submissions.loadPending.mockImplementationOnce(async () => view.set({ ...READY, status: 'empty', cards: [] }));
    await mount();
    expect(host.querySelector('sd-empty')?.getAttribute('title')).toBe('Queue is clear');
  });

  it('collapses an approved card to a status row', async () => {
    await mount();
    view.set({ ...READY, cards: [{ ...SUBMISSION_CARD, state: 'approved' }, READY.cards[1]!] });
    fixture.detectChanges();
    expect(cards().length).toBe(1);
    const row = host.querySelector('.approved-row');
    expect(row?.getAttribute('role')).toBe('status');
    expect(row?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Approved · Port Credit Buskerfest');
  });

  it('approves after D23 confirms, and leaves it alone when dismissed', async () => {
    await mount();
    dialog.open.mockReturnValueOnce({ closed: of('confirm') });
    (cards()[0]!.querySelector('.review-actions sd-button[variant="primary"] button') as HTMLButtonElement).click();
    await settle();
    expect(dialog.open).toHaveBeenCalledWith(
      ApproveSubmissionDialog,
      expect.objectContaining({ data: { card: SUBMISSION_CARD } }),
    );
    expect(submissions.approve).toHaveBeenCalledWith('s-buskerfest');

    await component['approve'](SUBMISSION_CARD);
    expect(submissions.approve).toHaveBeenCalledTimes(1);
  });

  it('rejects with the reason from D24, sending null for a blank one', async () => {
    await mount();
    dialog.open.mockReturnValueOnce({ closed: of({ reason: 'Already listed.' }) });
    (cards()[1]!.querySelector('.review-actions sd-button[variant="quiet"] button') as HTMLButtonElement).click();
    await settle();
    expect(dialog.open).toHaveBeenCalledWith(
      RejectSubmissionDialog,
      expect.objectContaining({ data: { card: READY.cards[1] } }),
    );
    expect(submissions.reject).toHaveBeenCalledWith('s-market', 'Already listed.');

    dialog.open.mockReturnValueOnce({ closed: of({ reason: '' }) });
    await component['reject'](SUBMISSION_CARD);
    expect(submissions.reject).toHaveBeenLastCalledWith('s-buskerfest', null);

    await component['reject'](SUBMISSION_CARD);
    expect(submissions.reject).toHaveBeenCalledTimes(2);
  });

  it('shows a warn banner when the review call fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await mount();
    submissions.approve.mockRejectedValueOnce(new Error('500'));
    dialog.open.mockReturnValueOnce({ closed: of('confirm') });
    await component['approve'](SUBMISSION_CARD);
    fixture.detectChanges();
    expect(host.querySelector('sd-banner.error')?.textContent?.trim()).toBe(
      'That did not go through. Try again in a moment.',
    );
    consoleError.mockRestore();
  });
});
