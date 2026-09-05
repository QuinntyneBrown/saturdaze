import { vi } from 'vitest';
import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { BlockRow, FAMILY_SERVICE, FamilyView, WEEKEND_PLAN_SERVICE, WeekendView } from 'api';

import { AddErrandDialog } from '../../dialogs/add-errand-dialog/add-errand-dialog';
import { BlockDialog } from '../../dialogs/block-dialog/block-dialog';
import { CalendarDialog } from '../../dialogs/calendar-dialog/calendar-dialog';
import { ConfirmDialog } from '../../dialogs/confirm-dialog/confirm-dialog';
import { ErrandAddedDialog } from '../../dialogs/errand-added-dialog/errand-added-dialog';
import { ShareDialog } from '../../dialogs/share-dialog/share-dialog';
import { MenuOpener } from '../../shell/menu-opener';
import { BLOCK, BLOCK_COMMITMENT } from '../dialogs/dialog-fixtures';
import { WeekendPage } from './weekend.page';

const ERRAND_BLOCK: BlockRow = {
  ...BLOCK,
  id: 'b-costco',
  refId: 'e-costco',
  day: 'Sunday',
  kind: 'Errand',
  time: '9:15',
  timeRange: '9:15 to 10:00',
  title: 'Costco run',
  subtitle: 'Paper towels, bread, yogurt',
  reason: null,
  chips: [{ tone: 'indoor', label: 'Errand' }],
  errand: true,
  highlight: false,
  swappable: false,
};

const LOADING: WeekendView = {
  status: 'loading',
  id: null,
  weekendOf: null,
  headline: 'This weekend',
  subtitle: '',
  days: [],
  blockCount: 0,
};

const EMPTY: WeekendView = { ...LOADING, status: 'empty', headline: 'Your first weekend' };

const READY: WeekendView = {
  status: 'ready',
  id: 'w1',
  weekendOf: '2026-05-16',
  headline: 'This weekend',
  subtitle: 'Lavender on Saturday, pancakes on Sunday.',
  blockCount: 3,
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
    },
    {
      day: 'Sunday',
      dateIso: '2026-05-17',
      dateLabel: '17 May',
      weather: { day: 'Sunday', icon: 'partly', hi: '18', lo: '12', note: 'Cloudy by 2pm' },
      meta: '17 May · 18° / 12° · Cloudy by 2pm',
      locked: true,
      keeping: ['Church 10:30'],
      blocks: [ERRAND_BLOCK],
    },
  ],
};

const FAMILY_LOADING: FamilyView = {
  status: 'loading',
  headline: 'Your family',
  subtitle: '',
  home: { location: '', hint: 'Weather and drive times start here' },
  members: [],
  commitments: [],
  likes: [],
  dislikes: [],
  preferences: [],
  plannedAround: [],
};

const FAMILY_READY: FamilyView = {
  ...FAMILY_LOADING,
  status: 'ready',
  headline: 'The Browns',
  subtitle: 'Port Credit. Every weekend is planned around this.',
  plannedAround: [
    { icon: 'user', title: 'The Browns, Port Credit', subtitle: '2 parents · Eli 9 · Mae 5', href: '/family' },
    { icon: 'lock', title: 'Swim lessons, Church', subtitle: 'Locked in every weekend', href: '/family' },
  ],
};

/** Flush every pending microtask (the app is zoneless, so whenStable cannot see mocked promises). */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('WeekendPage', () => {
  let fixture: ComponentFixture<WeekendPage>;
  let component: WeekendPage;
  let host: HTMLElement;
  let weekendSig: WritableSignal<WeekendView>;
  let familySig: WritableSignal<FamilyView>;
  let weekend: any;
  let family: any;
  let dialog: { open: ReturnType<typeof vi.fn> };
  let menu: { open: ReturnType<typeof vi.fn>; dialog: unknown };

  async function mount(query: Record<string, string> = {}): Promise<void> {
    const queryParamMap = convertToParamMap(query);
    await TestBed.configureTestingModule({
      imports: [WeekendPage],
      providers: [
        provideRouter([]),
        { provide: WEEKEND_PLAN_SERVICE, useValue: weekend },
        { provide: FAMILY_SERVICE, useValue: family },
        { provide: Dialog, useValue: dialog },
        { provide: MenuOpener, useValue: menu },
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
    fixture = TestBed.createComponent(WeekendPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  /** Mount and let the constructor's loadCurrent land. */
  async function mountReady(view: WeekendView = READY, query: Record<string, string> = {}): Promise<void> {
    weekend.loadCurrent.mockImplementation(async () => weekendSig.set(view));
    await mount(query);
    await settle();
    fixture.detectChanges();
  }

  beforeEach(() => {
    weekendSig = signal<WeekendView>(LOADING);
    familySig = signal<FamilyView>(FAMILY_LOADING);
    weekend = {
      getWeekend: () => weekendSig,
      loadCurrent: vi.fn(async () => undefined),
      plan: vi.fn(async () => weekendSig.set(READY)),
      regenerate: vi.fn(async () => undefined),
      regenerateDay: vi.fn(async () => undefined),
      createShareLink: vi.fn(async () => 'https://saturdaze.app/sample-weekend?share=abc'),
      calendarExport: vi.fn(() => ({ icsUrl: 'http://api/calendar.ics', fileName: 'weekend-16-may.ics', eventCount: 8 })),
      lockBlock: vi.fn(async () => undefined),
      swapBlock: vi.fn(async () => undefined),
      lockDay: vi.fn(async () => undefined),
      addErrand: vi.fn(async () => null),
      setErrandDone: vi.fn(async () => undefined),
    };
    family = {
      getFamily: () => familySig,
      load: vi.fn(async () => familySig.set(FAMILY_READY)),
    };
    dialog = { open: vi.fn(() => ({ closed: of(undefined) })) };
    menu = { open: vi.fn(async () => undefined), dialog };
  });

  const header = (): Element => host.querySelector('sd-page-header')!;
  const button = (label: string): HTMLButtonElement =>
    host.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
  const confirmData = (): any => dialog.open.mock.calls.find((c) => c[0] === ConfirmDialog)?.[1].data;

  it('opens on skeleton days while the weekend loads', async () => {
    await mount();
    expect(weekend.loadCurrent).toHaveBeenCalledTimes(1);
    expect(header().getAttribute('title')).toBe('This weekend');
    expect(header().getAttribute('subtitle')).toBe('Opening this weekend.');
    expect(host.querySelector('.sd-grid-days[aria-busy="true"]')).not.toBeNull();
    expect(host.querySelectorAll('sd-day').length).toBe(2);
    expect(host.querySelectorAll('sd-skeleton-row').length).toBe(8);
    expect(host.querySelector('sd-button[slot="primary"]')?.hasAttribute('disabled')).toBe(true);
  });

  it('renders both days with their blocks and row actions once the plan is ready', async () => {
    await mountReady();
    expect(family.load).not.toHaveBeenCalled();
    expect(header().getAttribute('subtitle')).toBe(READY.subtitle);
    expect(host.querySelector('sd-button[slot="primary"]')?.hasAttribute('disabled')).toBe(false);

    const days = Array.from(host.querySelectorAll('sd-day'));
    expect(days.map((d) => d.getAttribute('title'))).toEqual(['Saturday', 'Sunday']);
    expect(days.map((d) => d.getAttribute('weather'))).toEqual(['sun', 'cloud']);
    expect(days[1]?.hasAttribute('locked')).toBe(true);
    expect(host.querySelectorAll('sd-ghost-row').length).toBe(2);

    const blocks = Array.from(host.querySelectorAll('sd-block'));
    expect(blocks.map((b) => b.getAttribute('title'))).toEqual([
      'Swim lessons',
      'Terre Bleu Lavender Farm',
      'Costco run',
    ]);
    expect(button('About Swim lessons')).not.toBeNull();
    expect(button('Swap Swim lessons')).toBeNull();
    expect(button('Lock Swim lessons')).toBeNull();
    expect(button('Why this: Terre Bleu Lavender Farm')).not.toBeNull();
    expect(button('Swap Terre Bleu Lavender Farm')).not.toBeNull();
    expect(button('Lock Terre Bleu Lavender Farm')).not.toBeNull();
    expect(button('Mark Costco run done')).not.toBeNull();
  });

  it('shows the first-run empty state, drafted around the family', async () => {
    await mountReady(EMPTY);
    expect(family.load).toHaveBeenCalledTimes(1);
    expect(header().getAttribute('title')).toBe('Your first weekend');
    expect(header().getAttribute('subtitle')).toBe('Nothing is drafted yet. Planning takes a few seconds.');
    expect(host.querySelector('sd-button[slot="primary"]')).toBeNull();
    expect(host.querySelector('sd-empty')?.getAttribute('title')).toBe(
      'Saturday and Sunday, drafted around The Browns',
    );
    const rows = Array.from(host.querySelectorAll('.planned sd-list-item'));
    expect(rows.map((r) => r.getAttribute('title'))).toEqual(['The Browns, Port Credit', 'Swim lessons, Church']);
    expect(rows.every((r) => r.getAttribute('href') === '/family')).toBe(true);

    (host.querySelector('sd-empty sd-button[slot="cta"] button') as HTMLButtonElement).click();
    await settle();
    fixture.detectChanges();
    expect(weekend.plan).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
    expect(host.querySelectorAll('sd-block').length).toBe(3);
  });

  it('honours ?state=empty and ?state=generating for the design harness', async () => {
    await mountReady(READY, { state: 'empty' });
    expect(header().getAttribute('title')).toBe('Your first weekend');
    expect(host.querySelector('sd-empty')?.getAttribute('title')).toBe(
      'Saturday and Sunday, drafted around The Browns',
    );

    TestBed.resetTestingModule();
    weekend.loadCurrent.mockClear();
    await mount({ state: 'generating' });
    expect(weekend.loadCurrent).not.toHaveBeenCalled();
    expect(header().getAttribute('subtitle')).toBe('Sketching Saturday and Sunday. Usually four to six seconds.');
    expect(host.querySelector('sd-status-row')?.textContent?.trim()).toBe(
      'Working through your locks, the forecast and past weekends.',
    );
    expect(host.querySelectorAll('sd-skeleton-row').length).toBe(8);
  });

  it('shares through a fresh link and opens the calendar dialog', async () => {
    await mountReady();
    (host.querySelector('sd-button[slot="primary"] button') as HTMLButtonElement).click();
    await settle();
    expect(weekend.createShareLink).toHaveBeenCalledTimes(1);
    expect(dialog.open).toHaveBeenCalledWith(
      ShareDialog,
      expect.objectContaining({ data: { shareUrl: 'https://saturdaze.app/sample-weekend?share=abc' } }),
    );

    (host.querySelector('sd-button[slot="actions"] button') as HTMLButtonElement).click();
    expect(weekend.calendarExport).toHaveBeenCalledTimes(1);
    expect(dialog.open).toHaveBeenLastCalledWith(
      CalendarDialog,
      expect.objectContaining({ data: { calendar: { icsUrl: 'http://api/calendar.ics', fileName: 'weekend-16-may.ics', eventCount: 8 } } }),
    );
  });

  it('offers Regenerate and Add to calendar from the More menu', async () => {
    await mountReady();
    menu.open.mockResolvedValueOnce({ id: 'calendar', label: 'Add to calendar', icon: 'calendar' });
    (host.querySelector('sd-button[slot="more"] button') as HTMLButtonElement).click();
    await settle();
    expect(menu.open).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        title: 'Weekend options',
        items: [expect.objectContaining({ id: 'regenerate' }), expect.objectContaining({ id: 'calendar' })],
      }),
    );
    expect(dialog.open).toHaveBeenLastCalledWith(CalendarDialog, expect.anything());

    menu.open.mockResolvedValueOnce({ id: 'regenerate', label: 'Regenerate the weekend', icon: 'refresh' });
    dialog.open.mockReturnValueOnce({ closed: of('confirm') });
    (host.querySelector('sd-button[slot="more"] button') as HTMLButtonElement).click();
    await settle();
    expect(confirmData()).toMatchObject({
      title: 'Regenerate the weekend?',
      body: 'Locked blocks stay where they are.',
      well: { title: 'Keeping', body: 'Swim 9:00 · Church 10:30' },
      confirmLabel: 'Regenerate',
    });
    expect(weekend.regenerate).toHaveBeenCalledTimes(1);
  });

  it('does not regenerate when the confirmation is dismissed', async () => {
    await mountReady();
    await component['regenerateWeekend']();
    expect(dialog.open).toHaveBeenCalledWith(ConfirmDialog, expect.anything());
    expect(weekend.regenerate).not.toHaveBeenCalled();
  });

  it('regenerates one day after its own confirmation, and locks a day directly', async () => {
    await mountReady();
    dialog.open.mockReturnValueOnce({ closed: of('confirm') });
    button('Regenerate Saturday').click();
    await settle();
    expect(confirmData()).toMatchObject({
      title: 'Regenerate Saturday?',
      body: 'Sunday will not change.',
      well: { title: 'Keeping on Saturday', body: 'Swim 9:00' },
      confirmLabel: 'Regenerate Saturday',
    });
    expect(weekend.regenerateDay).toHaveBeenCalledWith('Saturday');

    button('Lock Saturday').click();
    button('Unlock Sunday').click();
    await settle();
    expect(weekend.lockDay).toHaveBeenNthCalledWith(1, 'Saturday', true);
    expect(weekend.lockDay).toHaveBeenNthCalledWith(2, 'Sunday', false);
  });

  it('routes the row buttons to swap, lock and done', async () => {
    await mountReady();
    button('Swap Terre Bleu Lavender Farm').click();
    button('Lock Terre Bleu Lavender Farm').click();
    button('Mark Costco run done').click();
    await settle();
    expect(weekend.swapBlock).toHaveBeenCalledWith('b-lavender');
    expect(weekend.lockBlock).toHaveBeenCalledWith('b-lavender', true);
    expect(weekend.setErrandDone).toHaveBeenCalledWith('e-costco', true);
  });

  it('opens block details (D1) and applies what was chosen there', async () => {
    await mountReady();
    dialog.open.mockReturnValueOnce({ closed: of({ kind: 'lock', locked: true }) });
    button('Why this: Terre Bleu Lavender Farm').click();
    await settle();
    expect(dialog.open).toHaveBeenCalledWith(BlockDialog, expect.objectContaining({ data: { block: BLOCK } }));
    expect(weekend.lockBlock).toHaveBeenCalledWith('b-lavender', true);

    dialog.open.mockReturnValueOnce({ closed: of({ kind: 'done', done: true }) });
    (host.querySelector('sd-block[title="Costco run"] .block__chev') as HTMLButtonElement).click();
    await settle();
    expect(weekend.setErrandDone).toHaveBeenCalledWith('e-costco', true);
  });

  it('adds an errand (D7) and then shows where it landed (D9)', async () => {
    await mountReady();
    const placement = { description: 'Costco run', day: 'Sunday', time: '9:15', endTime: '10:00', blockId: 'b-new' };
    dialog.open.mockReturnValueOnce({ closed: of(placement) });
    (host.querySelector('sd-ghost-row button') as HTMLButtonElement).click();
    await settle();
    expect(dialog.open).toHaveBeenNthCalledWith(1, AddErrandDialog, expect.objectContaining({ panelClass: 'sd-dialog-panel' }));
    expect(dialog.open).toHaveBeenNthCalledWith(2, ErrandAddedDialog, expect.objectContaining({ data: { placement } }));

    dialog.open.mockClear();
    (host.querySelector('sd-ghost-row button') as HTMLButtonElement).click();
    await settle();
    expect(dialog.open).toHaveBeenCalledTimes(1);
  });

  it('shows one warn banner when an action fails, and clears it on the next one', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await mountReady();
    weekend.lockDay.mockRejectedValueOnce(new Error('500'));
    button('Lock Saturday').click();
    await settle();
    fixture.detectChanges();
    expect(host.querySelector('sd-banner.error')?.textContent?.trim()).toBe(
      'Something did not go through. Try again in a moment.',
    );

    button('Lock Saturday').click();
    await settle();
    fixture.detectChanges();
    expect(host.querySelector('sd-banner.error')).toBeNull();
    consoleError.mockRestore();
  });
});
