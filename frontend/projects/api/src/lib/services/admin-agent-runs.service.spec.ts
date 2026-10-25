import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { AgentRunDto } from '../models/admin/agent-runs.dto';
import { AdminAgentRunsService } from './admin-agent-runs.service';

const BASE = 'http://localhost:3000';

const run = (over: Partial<AgentRunDto> = {}): AgentRunDto => ({
  id: 'r1',
  weekendOf: '2026-10-31',
  trigger: 'Scheduled',
  status: 'Applied',
  fallbackReason: null,
  queuedUtc: '2026-10-30T12:00:00+00:00',
  startedUtc: '2026-10-30T12:00:00+00:00',
  finishedUtc: '2026-10-30T12:01:20+00:00',
  rounds: 2,
  modelCalls: 7,
  toolCalls: 12,
  webSearches: 0,
  inputTokens: 48210,
  outputTokens: 3904,
  costUsd: 0.2032,
  traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
  policyViolations: 0,
  ...over,
});

describe('AdminAgentRunsService (L2-210)', () => {
  let service: AdminAgentRunsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminAgentRunsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(AdminAgentRunsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('words the totals and each run as the mock does', async () => {
    const pending = service.list();
    const req = httpMock.expectOne((r) => r.url === `${BASE}/api/admin/agent-runs`);
    expect(req.request.params.get('take')).toBe('50');
    req.flush({
      runs: [
        run(),
        run({
          id: 'r2',
          trigger: 'OnDemand',
          status: 'FellBack',
          fallbackReason: 'Timeout',
          rounds: 1,
          modelCalls: 2,
          inputTokens: 9880,
          outputTokens: 0,
          costUsd: 0.0296,
        }),
        run({
          id: 'r3',
          trigger: 'OnDemand',
          status: 'Running',
          startedUtc: '2026-10-30T12:05:00+00:00',
          rounds: 0,
          modelCalls: 0,
          inputTokens: 0,
          outputTokens: 0,
          costUsd: 0,
          traceId: null,
        }),
      ],
      totals: {
        runsToday: 14,
        appliedToday: 12,
        fellBackToday: 2,
        spendThisMonthUsd: 3.18,
        monthlyCapUsd: 25,
        runsPerDayCap: 60,
      },
    });
    const view = await pending;

    expect(view).toMatchObject({
      runsToday: '14',
      runsCap: 'of 60 allowed a day',
      appliedToday: '12',
      fellBackToday: '2',
      spend: 'US$3.18',
      spendCap: 'of the US$25.00 monthly cap',
      spendPercent: 13,
    });
    expect(view.runs.map((r) => [r.title, r.meta, r.status.label])).toEqual([
      [
        'Weekend of 31 Oct · Scheduled',
        '30 Oct 2026, 12:00pm UTC · 2 rounds · 7 model calls · 48,210 in / 3,904 out · US$0.2032',
        'Applied',
      ],
      [
        'Weekend of 31 Oct · On demand',
        '30 Oct 2026, 12:00pm UTC · 1 round · 2 model calls · 9,880 in / 0 out · US$0.0296',
        'Fell back · Timeout',
      ],
      [
        'Weekend of 31 Oct · On demand',
        '30 Oct 2026, 12:05pm UTC · 0 rounds · 0 model calls',
        'Running',
      ],
    ]);
    expect(view.runs[2]!.traceId).toBeNull();
  });
});
