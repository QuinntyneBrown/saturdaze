import { vi } from 'vitest';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PastView, PastWeekendCard, SAVED_SERVICE, WEEKEND_PLAN_SERVICE } from 'api';

import { ConfirmDialog } from '../../dialogs/confirm-dialog/confirm-dialog';
import { RatingDialog } from '../../dialogs/rating-dialog/rating-dialog';
import { RenameWeekendDialog } from '../../dialogs/rename-weekend-dialog/rename-weekend-dialog';
import { PastPage } from './past.page';

const LAVENDER: PastWeekendCard = {
  id: 'w1',
  weekendOf: '2026-05-09',
  eyebrow: '9 – 10 May 2026',
  title: 'Bronte Creek + Rec Room',
  customTitle: null,
  rating: 5,
  ratingLabel: '5 of 5',
  highlights: 'Bronte Creek · Rec Room',
  favourite: true,
};

const RAINY: PastWeekendCard = {
  id: 'w2',
  weekendOf: '2026-04-04',
  eyebrow: '4 – 5 Apr 2026',
  title: 'Rainy Rec Room',
  customTitle: 'Rainy Rec Room',
  rating: 0,
  ratingLabel: 'Rate it',
  highlights: 'The Rec Room',
  favourite: false,
};

const LOADING: PastView = {
  status: 'loading',
  subtitle: '',
  filters: [],
  weekends: [],
  skipping: [],
  filterEmpty: null,
};

const READY: PastView = {
  status: 'ready',
  subtitle: 'Two weekends so far. Repeat what worked, remix the rest.',
  filters: [
    { label: 'All', tone: 'neutral', active: true },
    { label: 'Favourites', tone: 'accent', icon: 'heart', active: false },
    { label: 'This year', tone: 'neutral', active: false },
    { label: '5★', tone: 'sun', active: false },
  ],
  weekends: [LAVENDER, RAINY],
  skipping: [{ tone: 'warn', icon: 'close', label: 'The Rec Room · rated 2★ on 6 Apr' }],
  filterEmpty: null,
};

/** Flush every pending microtask (the app is zoneless, so whenStable cannot see mocked promises). */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('PastPage', () => {
  let fixture: ComponentFixture<PastPage>;
  let component: PastPage;
  let host: HTMLElement;
  let view: ReturnType<typeof signal<PastView>>;
  let saved: any;
  let weekend: { repeatSaved: ReturnType<typeof vi.fn>; remixSaved: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let navigate: ReturnType<typeof vi.spyOn>;

  async function mount(query: Record<string, string> = {}): Promise<void> {
    const queryParamMap = convertToParamMap(query);
    await TestBed.configureTestingModule({
      imports: [PastPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: SAVED_SERVICE, useValue: saved },
        { provide: WEEKEND_PLAN_SERVICE, useValue: weekend },
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
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(PastPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    view = signal<PastView>(LOADING);
    saved = {
      list: () => view,
      load: vi.fn(async () => view.set(READY)),
      setFilter: vi.fn(),
      setFavourite: vi.fn(async () => undefined),
      rate: vi.fn(async () => undefined),
      rename: vi.fn(async () => undefined),
    };
    weekend = { repeatSaved: vi.fn(async () => undefined), remixSaved: vi.fn(async () => undefined) };
    dialog = { open: vi.fn(() => ({ closed: of(undefined) })) };
  });

  const header = (): Element => host.querySelector('sd-page-header')!;
  const cards = (): HTMLElement[] => Array.from(host.querySelectorAll('sd-past-card'));
  const confirmData = (): any => dialog.open.mock.calls.find((c) => c[0] === ConfirmDialog)?.[1].data;

  it('gathers the weekends, then renders filters, the skipping strip and the cards', async () => {
    saved.load.mockImplementationOnce(() => new Promise<void>(() => undefined));
    await mount();
    expect(saved.load).toHaveBeenCalledTimes(1);
    expect(header().getAttribute('title')).toBe('Past weekends');
    expect(host.querySelector('sd-status-row')?.textContent?.trim()).toBe('Gathering your weekends.');

    view.set(READY);
    fixture.detectChanges();
    expect(header().getAttribute('subtitle')).toBe(READY.subtitle);
    const chips = Array.from(host.querySelectorAll('sd-filter-chip'));
    expect(chips.map((c) => c.textContent?.trim())).toEqual(['All', 'Favourites', 'This year', '5★']);
    expect(chips[0]?.hasAttribute('pressed')).toBe(true);
    expect(host.querySelector('.strip')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Skipping next time: The Rec Room · rated 2★ on 6 Apr',
    );
    expect(cards().map((c) => c.getAttribute('title'))).toEqual(['Bronte Creek + Rec Room', 'Rainy Rec Room']);
    expect(cards()[0]?.getAttribute('rating')).toBe('5');
    expect(cards()[0]?.hasAttribute('favourite')).toBe(true);
    expect(cards()[1]?.getAttribute('rating')).toBeNull();
  });

  it('shows the empty state for ?state=empty without loading', async () => {
    await mount({ state: 'empty' });
    expect(saved.load).not.toHaveBeenCalled();
    expect(header().getAttribute('subtitle')).toBe('Your first weekend lands here once Sunday is over.');
    expect(host.querySelector('sd-empty')?.getAttribute('title')).toBe('Nothing here yet');
    expect(host.querySelector('sd-empty sd-button a')?.getAttribute('href')).toBe('/weekend');
  });

  it('shows the empty state when the family has no history', async () => {
    saved.load.mockImplementationOnce(async () => view.set({ ...READY, status: 'empty', weekends: [] }));
    await mount();
    expect(host.querySelector('sd-empty')?.getAttribute('title')).toBe('Nothing here yet');
  });

  it('filters through the service and explains an empty filter', async () => {
    await mount();
    (host.querySelectorAll('sd-filter-chip button')[1] as HTMLButtonElement).click();
    expect(saved.setFilter).toHaveBeenCalledWith('Favourites');

    view.set({ ...READY, weekends: [], filterEmpty: 'No favourites yet. Tap the heart on a weekend you loved.' });
    fixture.detectChanges();
    expect(cards().length).toBe(0);
    expect(host.querySelector('sd-empty')?.getAttribute('title')).toBe('Nothing matches');
    expect(host.querySelector('sd-empty .empty__body')?.textContent?.trim()).toBe(
      'No favourites yet. Tap the heart on a weekend you loved.',
    );
  });

  it('toggles the favourite heart', async () => {
    await mount();
    (cards()[1]!.querySelector('.fav-btn') as HTMLButtonElement).click();
    await settle();
    expect(saved.setFavourite).toHaveBeenCalledWith('w2', true);
  });

  it('renames through D14 with the custom title, and saves null to go back to the generated one', async () => {
    await mount();
    dialog.open.mockReturnValueOnce({ closed: of({ title: 'Lavender weekend' }) });
    (cards()[0]!.querySelector('.card__title-btn') as HTMLButtonElement).click();
    await settle();
    expect(dialog.open).toHaveBeenCalledWith(
      RenameWeekendDialog,
      expect.objectContaining({ data: { eyebrow: '9 – 10 May 2026', title: null } }),
    );
    expect(saved.rename).toHaveBeenCalledWith('w1', 'Lavender weekend');

    dialog.open.mockReturnValueOnce({ closed: of({ title: null }) });
    await component['rename'](RAINY);
    expect(dialog.open).toHaveBeenLastCalledWith(
      RenameWeekendDialog,
      expect.objectContaining({ data: { eyebrow: '4 – 5 Apr 2026', title: 'Rainy Rec Room' } }),
    );
    expect(saved.rename).toHaveBeenLastCalledWith('w2', null);

    await component['rename'](RAINY);
    expect(saved.rename).toHaveBeenCalledTimes(2);
  });

  it('rates through D13', async () => {
    await mount();
    dialog.open.mockReturnValueOnce({ closed: of({ rating: 4 }) });
    (cards()[1]!.querySelector('.card__rate') as HTMLButtonElement).click();
    await settle();
    expect(dialog.open).toHaveBeenCalledWith(
      RatingDialog,
      expect.objectContaining({ data: { eyebrow: '4 – 5 Apr 2026 · Rainy Rec Room', rating: null } }),
    );
    expect(saved.rate).toHaveBeenCalledWith('w2', 4);
  });

  it('repeats a weekend after the danger confirmation and hops to /weekend', async () => {
    await mount();
    dialog.open.mockReturnValueOnce({ closed: of('confirm') });
    (cards()[0]!.querySelector('.card__footer sd-button[variant="primary"] button') as HTMLButtonElement).click();
    await settle();
    expect(confirmData()).toMatchObject({
      title: 'Use this weekend again?',
      confirmLabel: 'Replace draft',
      danger: true,
      well: { tone: 'warn' },
    });
    expect(weekend.repeatSaved).toHaveBeenCalledWith('w1');
    expect(navigate).toHaveBeenCalledWith('/weekend');
  });

  it('remixes after its confirmation, and stays put when dismissed', async () => {
    await mount();
    await component['remix'](LAVENDER);
    expect(confirmData()).toMatchObject({ title: 'Remix this weekend?', confirmLabel: 'Remix', icon: 'sparkle' });
    expect(weekend.remixSaved).not.toHaveBeenCalled();

    dialog.open.mockReturnValueOnce({ closed: of('confirm') });
    (cards()[1]!.querySelector('.card__footer sd-button[variant="quiet"] button') as HTMLButtonElement).click();
    await settle();
    expect(weekend.remixSaved).toHaveBeenCalledWith('w2');
    expect(navigate).toHaveBeenCalledWith('/weekend');
  });

  it('shows a warn banner when a save fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await mount();
    saved.setFavourite.mockRejectedValueOnce(new Error('500'));
    await component['favourite'](LAVENDER, false);
    fixture.detectChanges();
    expect(host.querySelector('sd-banner.error')?.textContent?.trim()).toBe(
      'That did not go through. Try again in a moment.',
    );
    consoleError.mockRestore();
  });
});
