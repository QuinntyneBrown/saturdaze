import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { block, settle, weekendDto } from '../testing/weekend-fixture';
import { WeekendPlanService } from './weekend-plan.service';

const BASE = 'http://localhost:3000';
const CURRENT = `${BASE}/api/weekends/current`;

describe('WeekendPlanService', () => {
  let service: WeekendPlanService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        WeekendPlanService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(WeekendPlanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  /** Load the current weekend, answer the GET and wait for it to apply. */
  async function loadCurrent(dto = weekendDto()): Promise<void> {
    const pending = service.loadCurrent();
    httpMock.expectOne(CURRENT).flush(dto);
    await pending;
    await settle();
  }

  describe('loadCurrent', () => {
    it('starts loading and projects the weekend once it arrives', async () => {
      expect(service.getWeekend()().status).toBe('loading');
      await loadCurrent();
      const view = service.getWeekend()();
      expect(view.status).toBe('ready');
      expect(view.id).toBe('w1');
      expect(view.headline).toBe('This weekend');
      expect(view.days.map((d) => d.day)).toEqual(['Saturday', 'Sunday']);
      expect(view.blockCount).toBe(8);
    });

    it('maps a 404 to the empty state', async () => {
      const pending = service.loadCurrent();
      httpMock.expectOne(CURRENT).flush(null, { status: 404, statusText: 'Not Found' });
      await pending;
      await settle();
      const view = service.getWeekend()();
      expect(view.status).toBe('empty');
      expect(view.headline).toBe('Your first weekend');
      expect(view.subtitle).toBe('Nothing is drafted yet. Planning takes a few seconds.');
    });

    it('maps a weekend with zero blocks to the empty state', async () => {
      await loadCurrent(weekendDto({ blocks: [] }));
      expect(service.getWeekend()().status).toBe('empty');
      expect(service.getWeekend()().id).toBe('w1');
    });

    it('rejects on any other failure and stays loading', async () => {
      const first = service.loadCurrent();
      httpMock.expectOne(CURRENT).flush(null, { status: 500, statusText: 'Server Error' });
      await expect(first).rejects.toBeTruthy();
      expect(service.getWeekend()().status).toBe('loading');

      const retry = service.loadCurrent();
      httpMock.expectOne(CURRENT).flush(null, { status: 503, statusText: 'Unavailable' });
      await expect(retry).rejects.toBeTruthy();
    });
  });

  describe('plan', () => {
    it('POSTs the Saturday and applies the returned weekend', async () => {
      await loadCurrent(weekendDto({ blocks: [] }));
      const promise = service.plan('2026-05-16');
      const req = httpMock.expectOne(`${BASE}/api/weekends/plan`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ weekendOf: '2026-05-16' });
      req.flush(weekendDto());
      await promise;
      expect(service.getWeekend()().status).toBe('ready');
    });

    it('rejects when the server fails', async () => {
      await loadCurrent();
      const promise = service.plan('2026-05-16');
      promise.catch(() => undefined);
      httpMock
        .expectOne(`${BASE}/api/weekends/plan`)
        .flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });
      await expect(promise).rejects.toBeTruthy();
    });
  });

  describe('regenerate', () => {
    it('targets the current weekend, or an explicit id', async () => {
      await loadCurrent();
      const whole = service.regenerate();
      httpMock.expectOne(`${BASE}/api/weekends/w1/regenerate`).flush(weekendDto());
      await whole;

      const day = service.regenerateDay('Sunday', 'w9');
      const req = httpMock.expectOne(`${BASE}/api/weekends/w9/days/sunday/regenerate`);
      expect(req.request.method).toBe('POST');
      req.flush(weekendDto());
      await day;
    });

    it('rejects before any weekend is loaded', async () => {
      await expect(service.regenerate()).rejects.toThrow('No current weekend is loaded yet.');
      httpMock.expectOne(CURRENT).flush(weekendDto());
    });
  });

  it('creates a share link', async () => {
    await loadCurrent();
    const promise = service.createShareLink();
    const req = httpMock.expectOne(`${BASE}/api/weekends/w1/share`);
    expect(req.request.method).toBe('POST');
    req.flush({ shareUrl: 'https://app/sample-weekend?share=abc', token: 'abc' });
    await expect(promise).resolves.toBe('https://app/sample-weekend?share=abc');
  });

  it('describes the calendar export for the current weekend', async () => {
    await loadCurrent();
    expect(service.calendarExport()).toEqual({
      icsUrl: `${BASE}/api/weekends/w1/calendar.ics`,
      fileName: 'weekend-16-may.ics',
      eventCount: 8,
    });
    expect(service.calendarExport('other')).toEqual({
      icsUrl: `${BASE}/api/weekends/other/calendar.ics`,
      fileName: 'weekend.ics',
      eventCount: 0,
    });
  });

  describe('block actions', () => {
    beforeEach(async () => {
      await loadCurrent();
    });

    it('PUTs the lock flag', async () => {
      const promise = service.lockBlock('b1', true);
      const req = httpMock.expectOne(`${BASE}/api/blocks/b1/lock`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ locked: true });
      req.flush(
        weekendDto({
          blocks: weekendDto().blocks.map((b) => (b.id === 'b1' ? { ...b, isLocked: true } : b)),
        }),
      );
      await promise;
      const row = service
        .getWeekend()()
        .days[0]!.blocks.find((b) => b.id === 'b1')!;
      expect(row.locked).toBe(true);
      expect(row.swappable).toBe(false);
    });

    it('POSTs the rejected ids on swap and rejects on conflict', async () => {
      const ok = service.swapBlock('b1', ['a1']);
      const req = httpMock.expectOne(`${BASE}/api/blocks/b1/swap`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ rejectedActivityIds: ['a1'] });
      req.flush(weekendDto());
      await ok;

      const conflict = service.swapBlock('c1');
      conflict.catch(() => undefined);
      const bad = httpMock.expectOne(`${BASE}/api/blocks/c1/swap`);
      expect(bad.request.body).toEqual({ rejectedActivityIds: [] });
      bad.flush({ code: 'block_not_swappable' }, { status: 409, statusText: 'Conflict' });
      await expect(conflict).rejects.toBeTruthy();
    });

    it('PUTs the day lock', async () => {
      const promise = service.lockDay('Saturday', true);
      const req = httpMock.expectOne(`${BASE}/api/weekends/w1/days/saturday/lock`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ locked: true });
      req.flush(weekendDto());
      await promise;
    });

    it('PUTs the errand done flag and reflects it on the row', async () => {
      const promise = service.setErrandDone('err1', true);
      const req = httpMock.expectOne(`${BASE}/api/errands/err1/done`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ done: true });
      req.flush(
        weekendDto({
          errands: [{ id: 'err1', description: 'Costco run', estimatedMinutes: 45, done: true }],
        }),
      );
      await promise;
      expect(
        service
          .getWeekend()()
          .days[0]!.blocks.find((b) => b.id === 'e1')!.done,
      ).toBe(true);
    });
  });

  describe('addErrand', () => {
    it('sends the request and resolves with where the new block landed', async () => {
      await loadCurrent();
      const before = weekendDto();
      const promise = service.addErrand('Milk run', 30, null);
      const req = httpMock.expectOne(`${BASE}/api/weekends/w1/errands`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        description: 'Milk run',
        estimatedMinutes: 30,
        preferredDay: null,
      });
      req.flush(
        weekendDto({
          blocks: [
            ...before.blocks,
            block({
              id: 'e2',
              day: 'Sunday',
              kind: 'Errand',
              title: 'Milk run',
              refId: 'err2',
              startTime: '09:15:00',
              endTime: '10:00:00',
              sortOrder: 5,
            }),
          ],
          errands: [
            ...before.errands,
            { id: 'err2', description: 'Milk run', estimatedMinutes: 30, done: false },
          ],
        }),
      );
      await expect(promise).resolves.toEqual({
        description: 'Milk run',
        day: 'Sunday',
        time: '9:15',
        endTime: '10:00',
        blockId: 'e2',
      });
      expect(service.getWeekend()().blockCount).toBe(9);
    });

    it('sends the preferred day and resolves null when nothing was placed', async () => {
      await loadCurrent();
      const promise = service.addErrand('Milk run', 30, 'Sunday');
      const req = httpMock.expectOne(`${BASE}/api/weekends/w1/errands`);
      expect(req.request.body).toMatchObject({ preferredDay: 'Sunday' });
      req.flush(weekendDto());
      await expect(promise).resolves.toBeNull();
    });
  });

  it('remixes and repeats a saved weekend into the current one', async () => {
    await loadCurrent(weekendDto({ blocks: [] }));
    const remix = service.remixSaved('old1');
    httpMock.expectOne(`${BASE}/api/weekends/old1/remix`).flush(weekendDto({ id: 'w2' }));
    await remix;
    expect(service.getWeekend()().id).toBe('w2');

    const repeat = service.repeatSaved('old2');
    const req = httpMock.expectOne(`${BASE}/api/weekends/old2/repeat`);
    expect(req.request.method).toBe('POST');
    req.flush(weekendDto({ id: 'w3' }));
    await repeat;
    expect(service.getWeekend()().id).toBe('w3');
  });
});
