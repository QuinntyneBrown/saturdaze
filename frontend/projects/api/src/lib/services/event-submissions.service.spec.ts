import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { EventSubmissionDto } from '../models/event-submission.dto';
import {
  EventSubmissionsService,
  reviewSubtitle,
  submissionWhen,
  toSubmissionCard,
} from './event-submissions.service';

const BASE = 'http://localhost:3000';

function submission(overrides: Partial<EventSubmissionDto> = {}): EventSubmissionDto {
  return {
    id: 'sub1',
    title: 'Port Credit Buskerfest',
    startsAtLocal: '2026-06-20T14:00',
    endsAtLocal: '2026-06-20T21:00',
    location: 'Memorial Park, Lakeshore Rd',
    description: 'Street performers along Lakeshore.',
    costNote: 'Free',
    ageRange: 'All ages',
    sourceUrl: 'https://example.com/buskerfest',
    status: 'Pending',
    submittedByUserId: 'u1',
    submittedByEmail: 'quinntynebrown@gmail.com',
    submittedAtUtc: '2026-05-16T10:00:00Z',
    reviewedAtUtc: null,
    rejectionReason: null,
    ...overrides,
  };
}

const NEWER = submission();
const OLDER = submission({
  id: 'sub0',
  title: "St. Christopher's spring fair",
  startsAtLocal: '2026-06-06T10:00',
  endsAtLocal: '2026-06-06T14:00',
  location: null,
  description: ' ',
  costNote: null,
  ageRange: null,
  sourceUrl: null,
  submittedByEmail: null,
  submittedAtUtc: '2026-05-13T10:00:00Z',
});

describe('EventSubmissionsService', () => {
  let service: EventSubmissionsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventSubmissionsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(EventSubmissionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  async function loadPending(rows: EventSubmissionDto[] = [NEWER, OLDER]): Promise<void> {
    const promise = service.loadPending();
    httpMock.expectOne(`${BASE}/api/events/submissions/pending`).flush(rows);
    await promise;
  }

  it('is loading until the queue arrives, then empty or ready', async () => {
    expect(service.review()().status).toBe('loading');
    await loadPending([]);
    expect(service.review()()).toEqual({
      status: 'empty',
      subtitle: 'Nothing waiting. New suggestions show up here as families send them.',
      cards: [],
    });
    await loadPending();
    expect(service.review()().status).toBe('ready');
  });

  it('sorts the queue oldest first and counts the waiting cards in words', async () => {
    await loadPending();
    const view = service.review()();
    expect(view.subtitle).toBe(
      'Two waiting, oldest first. Approving publishes to every family nearby.',
    );
    expect(view.cards.map((c) => c.id)).toEqual(['sub0', 'sub1']);
    expect(
      service
        .pending()()
        .map((r) => r.id),
    ).toEqual(['sub0', 'sub1']);
    expect(reviewSubtitle(1)).toBe(
      'One waiting, oldest first. Approving publishes to every family nearby.',
    );
  });

  it('maps a submission to a card, with blanks as null', () => {
    const now = Date.parse('2026-05-16T12:00:00Z');
    const full = toSubmissionCard(NEWER, 'pending', now);
    expect(full).toMatchObject({
      id: 'sub1',
      state: 'pending',
      title: 'Port Credit Buskerfest',
      tile: { day: '20', mon: 'Jun' },
      when: 'Sat 20 Jun · 2:00 to 9:00pm',
      location: 'Memorial Park, Lakeshore Rd',
      cost: 'Free',
      ages: 'All ages',
      link: 'https://example.com/buskerfest',
      notes: 'Street performers along Lakeshore.',
      submitter: { email: 'quinntynebrown@gmail.com', initial: 'Q', ago: '2 hours ago' },
    });
    expect(full.dto).toBe(NEWER);

    const sparse = toSubmissionCard(OLDER, 'approved', now);
    expect(sparse).toMatchObject({
      state: 'approved',
      when: 'Sat 6 Jun · 10:00am to 2:00pm',
      location: null,
      cost: null,
      ages: null,
      link: null,
      notes: null,
      submitter: { email: 'Unknown submitter', initial: '?', ago: '3 days ago' },
    });
  });

  it('writes the when line for open-ended and multi-day submissions', () => {
    expect(submissionWhen(submission({ endsAtLocal: null }))).toBe('Sat 20 Jun · 2:00pm');
    expect(
      submissionWhen(
        submission({ startsAtLocal: '2026-06-20T09:30', endsAtLocal: '2026-06-21T16:00' }),
      ),
    ).toBe('Sat 20 Jun 9:30am to Sun 21 Jun 4:00pm');
  });

  it('approves a card in place and keeps it out of pending', async () => {
    await loadPending();
    const promise = service.approve('sub0');
    const req = httpMock.expectOne(`${BASE}/api/events/submissions/sub0/approve`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush({ ...OLDER, status: 'Approved' });
    await promise;
    const view = service.review()();
    expect(view.cards.map((c) => [c.id, c.state])).toEqual([
      ['sub0', 'approved'],
      ['sub1', 'pending'],
    ]);
    expect(view.cards[0]!.dto.status).toBe('Approved');
    expect(view.subtitle).toMatch(/^One waiting/);
    expect(
      service
        .pending()()
        .map((r) => r.id),
    ).toEqual(['sub1']);
  });

  it('sends the drive minutes when given', async () => {
    await loadPending();
    const promise = service.approve('sub1', 30);
    const req = httpMock.expectOne(`${BASE}/api/events/submissions/sub1/approve`);
    expect(req.request.body).toEqual({ driveMinutes: 30 });
    req.flush({ ...NEWER, status: 'Approved' });
    await promise;
  });

  it('rejects a card out of the queue, with the reason trimmed or null', async () => {
    await loadPending();
    const withReason = service.reject('sub0', '  Duplicate  ');
    const req = httpMock.expectOne(`${BASE}/api/events/submissions/sub0/reject`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason: 'Duplicate' });
    req.flush({ ...OLDER, status: 'Rejected' });
    await withReason;
    expect(
      service
        .review()()
        .cards.map((c) => c.id),
    ).toEqual(['sub1']);

    const blank = service.reject('sub1', '   ');
    const blankReq = httpMock.expectOne(`${BASE}/api/events/submissions/sub1/reject`);
    expect(blankReq.request.body).toEqual({ reason: null });
    blankReq.flush({ ...NEWER, status: 'Rejected' });
    await blank;
    expect(service.review()().status).toBe('empty');
  });

  it('reloading the queue forgets this session’s approvals', async () => {
    await loadPending();
    const promise = service.approve('sub0');
    httpMock.expectOne(`${BASE}/api/events/submissions/sub0/approve`).flush(OLDER);
    await promise;
    await loadPending([NEWER]);
    expect(
      service
        .review()()
        .cards.map((c) => [c.id, c.state]),
    ).toEqual([['sub1', 'pending']]);
  });

  it('loads and prepends the family’s own submissions', async () => {
    const load = service.loadMine();
    httpMock.expectOne(`${BASE}/api/events/submissions/mine`).flush([OLDER]);
    await load;
    expect(
      service
        .mine()()
        .map((r) => r.id),
    ).toEqual(['sub0']);

    const payload = { title: 'Buskerfest', startsAtLocal: '2026-06-20T14:00' };
    const submit = service.submit(payload);
    const req = httpMock.expectOne(`${BASE}/api/events/submissions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(NEWER);
    await expect(submit).resolves.toBe(NEWER);
    expect(
      service
        .mine()()
        .map((r) => r.id),
    ).toEqual(['sub1', 'sub0']);
  });
});
