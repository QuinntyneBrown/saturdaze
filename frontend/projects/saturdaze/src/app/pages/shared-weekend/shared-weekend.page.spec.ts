import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { SHARED_WEEKEND_SERVICE, WeekendView } from 'api';

import { BLOCK, BLOCK_COMMITMENT } from '../dialogs/dialog-fixtures';
import { SharedWeekendPage } from './shared-weekend.page';

const READY: WeekendView = {
  status: 'ready',
  id: 'w1',
  weekendOf: '2026-05-16',
  headline: 'This weekend',
  subtitle: 'Lavender on Saturday, pancakes on Sunday.',
  blockCount: 3,
  cover: null,
  dateRange: '16 – 17 May',
  coverChoices: [],
  days: [
    {
      day: 'Saturday',
      dateIso: '2026-05-16',
      dateLabel: '16 May',
      weather: { day: 'Saturday', icon: 'sun', hi: '22', lo: '14', note: 'Light breeze' },
      meta: '16 May · 22° / 14° · Light breeze',
      locked: false,
      keeping: ['Swim 9:00'],
      blocks: [BLOCK_COMMITMENT, BLOCK],
      stops: [],
      home: null,
      drivingMinutes: 0,
      drivingKm: 0,
    },
    {
      day: 'Sunday',
      dateIso: '2026-05-17',
      dateLabel: '17 May',
      weather: { day: 'Sunday', icon: 'fog', hi: '18', lo: '12', note: 'Cloudy by 2pm' },
      meta: '17 May · 18° / 12° · Cloudy by 2pm',
      locked: true,
      keeping: [],
      blocks: [{ ...BLOCK, id: 'b-pancakes', day: 'Sunday', title: 'Pancakes at home' }],
      stops: [],
      home: null,
      drivingMinutes: 0,
      drivingKm: 0,
    },
  ],
};

/** Flush every pending microtask (the app is zoneless, so whenStable cannot see mocked promises). */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('SharedWeekendPage', () => {
  let fixture: ComponentFixture<SharedWeekendPage>;
  let host: HTMLElement;
  let shared: { load: ReturnType<typeof vi.fn> };
  let router: Router;

  async function mount(query: Record<string, string>): Promise<void> {
    const queryParamMap = convertToParamMap(query);
    await TestBed.configureTestingModule({
      imports: [SharedWeekendPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: SHARED_WEEKEND_SERVICE, useValue: shared },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
              queryParamMap,
              params: {},
              queryParams: query,
              data: {},
              fragment: null,
            },
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
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(SharedWeekendPage);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    shared = { load: vi.fn(async () => READY) };
  });

  const headerTitle = (): string | null =>
    host.querySelector('.page-header__title')?.textContent?.trim() ?? null;
  const headerSubtitle = (): string | null =>
    host.querySelector('.page-header__subtitle')?.textContent?.trim() ?? null;
  /** sun draws the sun-toned weather disc; cloud (and anything unknown) the sky-toned one. */
  const discTone = (day: Element): string | null =>
    ['sun', 'sky'].find((t) =>
      day.querySelector('.weather-disc')?.classList.contains(`disc--${t}`),
    ) ?? null;

  it('bounces to the landing page when there is no share token', async () => {
    await mount({});
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    expect(shared.load).not.toHaveBeenCalled();
  });

  it('shows skeleton days while the link resolves', async () => {
    let resolve!: (view: WeekendView) => void;
    shared.load.mockReturnValueOnce(new Promise<WeekendView>((r) => (resolve = r)));
    await mount({ share: 'tok-123' });
    expect(shared.load).toHaveBeenCalledWith('tok-123');
    expect(headerTitle()).toBe('A shared weekend');
    expect(headerSubtitle()).toBe('Opening the plan.');
    expect(host.querySelector('.sd-grid-days[aria-busy="true"]')).not.toBeNull();
    expect(host.querySelectorAll('sd-skeleton-row').length).toBe(8);

    resolve(READY);
    await settle();
    fixture.detectChanges();
    expect(host.querySelector('.sd-grid-days[aria-busy="true"]')).toBeNull();
  });

  it('renders the plan read-only, with no day or block actions', async () => {
    await mount({ share: 'tok-123' });
    await settle();
    fixture.detectChanges();

    expect(headerSubtitle()).toBe(READY.subtitle);
    expect(host.querySelector('sd-banner')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Shared with you, read-only. Create an account to plan your own.',
    );
    const days = Array.from(host.querySelectorAll('sd-day'));
    expect(days.map((d) => d.querySelector('.day__title')?.textContent?.trim())).toEqual([
      'Saturday',
      'Sunday',
    ]);
    expect(days.map(discTone)).toEqual(['sun', 'sky']);
    expect(days.map((d) => d.classList.contains('day--locked'))).toEqual([false, true]);
    expect(host.querySelectorAll('sd-day .day__actions').length).toBe(0);

    const blocks = Array.from(host.querySelectorAll('sd-block'));
    expect(blocks.map((b) => b.querySelector('.block__title')?.textContent?.trim())).toEqual([
      'Swim lessons',
      'Terre Bleu Lavender Farm',
      'Pancakes at home',
    ]);
    expect(blocks.map((b) => b.classList.contains('block--commitment'))).toEqual([
      true,
      false,
      false,
    ]);
    expect(host.querySelectorAll('.block__chev').length).toBe(0);
    expect(host.querySelectorAll('sd-block sd-chip').length).toBe(5);
  });

  it('treats an empty weekend as an expired link', async () => {
    shared.load.mockResolvedValueOnce({ ...READY, status: 'empty', days: [] });
    await mount({ share: 'tok-123' });
    await settle();
    fixture.detectChanges();
    expect(headerTitle()).toBe('This link has expired');
    expect(host.querySelector('sd-empty .empty__title')?.textContent?.trim()).toBe(
      'Plan one of your own',
    );
    expect(host.querySelector('sd-empty sd-button a')?.getAttribute('href')).toBe(
      '/create-account',
    );
  });

  it('shows the expired state when the API rejects the token', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    shared.load.mockRejectedValueOnce(new Error('404'));
    await mount({ share: 'bad' });
    await settle();
    fixture.detectChanges();
    expect(fixture.componentInstance['state']()).toBe('missing');
    expect(headerSubtitle()).toBe('Shared weekends stay open for seven days.');
    consoleError.mockRestore();
  });
});
