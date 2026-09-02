import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import { WEEKEND_PLAN_SERVICE, type ItineraryView } from 'api';
import { ItineraryPage } from './itinerary.page';

function itinerary(overrides: Partial<ItineraryView> = {}): ItineraryView {
  return {
    day: 'Saturday',
    eyebrow: '16 May 2026',
    title: 'Sunny & 22°',
    subtitle: 'Out the door by 9:00 — wraps by 20:00',
    icon: 'sun',
    chips: [{ tone: 'accent', icon: 'lock', label: '1 locked' }],
    dayOptions: [
      { key: 'saturday', label: 'Saturday', icon: 'sun', iconTone: 'sun', meta: '', active: true },
      { key: 'sunday', label: 'Sunday', icon: 'cloud', iconTone: 'soft', meta: '', active: false },
    ],
    stats: [{ num: '3', label: 'blocks planned' }],
    previewTitle: 'Saturday — timeline',
    previewSubtitle: '',
    blocks: [
      { id: 'c1', kind: 'Commitment', time: '9:00', title: 'Swim', icon: 'lock', locked: true },
      { id: 'b1', kind: 'Activity', time: '11:00', title: 'Terre Bleu', icon: 'tree' },
      { id: 'm1', kind: 'Meal', time: '13:00', title: 'La Marina', icon: 'fork' },
    ],
    ...overrides,
  };
}

describe('ItineraryPage', () => {
  let component: ItineraryPage;
  let fixture: ComponentFixture<ItineraryPage>;
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let weekend: any;
  const view = signal(itinerary());

  async function build(day: string | null) {
    const params = convertToParamMap(day ? { day } : {});
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ItineraryPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: params, params: {}, queryParams: {}, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(params),
          params: of({}), queryParams: of({}), data: of({}),
        } },
        { provide: WEEKEND_PLAN_SERVICE, useValue: weekend },
        { provide: Dialog, useValue: mockDialog },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ItineraryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    view.set(itinerary());
    mockDialog = { open: vi.fn(() => ({ closed: of('confirm') })) };
    weekend = {
      getItinerary: () => view,
      setActiveDay: vi.fn(),
      regenerateDay: vi.fn(() => Promise.resolve()),
      lockDay: vi.fn(() => Promise.resolve()),
      lockBlock: vi.fn(() => Promise.resolve()),
      swapBlock: vi.fn(() => Promise.resolve()),
      setErrandDone: vi.fn(() => Promise.resolve()),
    };
    await build(null);
  });

  it('renders the timeline once per container from a single template', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.it-detail-body sd-timeline-block')).toHaveLength(3);
    expect(el.querySelectorAll('#mobile-timeline sd-timeline-block')).toHaveLength(3);
    expect(el.textContent).toContain('Sunny & 22°');
  });

  it('selects the day from the query string', async () => {
    expect(weekend.setActiveDay).toHaveBeenCalledWith('Saturday');
    await build('sunday');
    expect(weekend.setActiveDay).toHaveBeenLastCalledWith('Sunday');
  });

  it('navigates when a day option is clicked with a plain left click', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const event = new MouseEvent('click', { button: 0, cancelable: true });
    component['selectDay'](event, 'sunday');
    expect(event.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalled();
    expect(navigate.mock.calls[0]![1]).toMatchObject({ queryParams: { day: 'sunday' } });
    navigate.mockClear();
    component['selectDay'](new MouseEvent('click', { button: 0, ctrlKey: true, cancelable: true }), 'sunday');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('regenerates the active day after confirmation', async () => {
    await component['regenerateDay']();
    expect(weekend.regenerateDay).toHaveBeenCalledWith('Saturday');
  });

  it('toggles the day lock based on whether every block is locked', async () => {
    await component['lockDay']();
    expect(weekend.lockDay).toHaveBeenCalledWith('Saturday', true);
    view.set(itinerary({ blocks: [{ id: 'c1', time: '', title: '', icon: '', locked: true }] }));
    await component['lockDay']();
    expect(weekend.lockDay).toHaveBeenLastCalledWith('Saturday', false);
  });

  it('opens the day on a map and sends the first activity to Google Maps', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    await component['seeMap']();
    expect(mockDialog.open.mock.calls[0][1].data).toMatchObject({ kind: 'map', day: 'Saturday' });
    expect(open).toHaveBeenCalledWith(
      'https://www.google.com/maps/search/?api=1&query=Terre%20Bleu',
      '_blank',
      'noopener',
    );
    open.mockRestore();
  });

  it('applies the block sheet result', async () => {
    mockDialog.open = vi.fn(() => ({ closed: of({ kind: 'lock', locked: true }) }));
    await component['openBlock']({ id: 'b1', kind: 'Activity', time: '', title: '', icon: '' });
    expect(weekend.lockBlock).toHaveBeenCalledWith('b1', true);
  });

  it('opens the more sheet for the active day', async () => {
    await component['openMore']();
    expect(mockDialog.open.mock.calls[0][1].data).toEqual({ kind: 'itinerary-more', day: 'Saturday' });
  });
});
