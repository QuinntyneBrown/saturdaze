import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import { WEEKEND_PLAN_SERVICE, upcomingSaturdayIso, type WeekendOverview } from 'api';
import { HomePage } from './home.page';

function overview(overrides: Partial<WeekendOverview> = {}): WeekendOverview {
  return {
    greeting: 'Morning, Browns 👋',
    heroSubtitle: 'Sat & Sun are looking warm.',
    heroCta: 'Plan This Weekend',
    forecastSubtitle: 'Sat 16 May – Sun 17 May',
    forecast: [{ day: 'Saturday', icon: 'sun', hi: '22', lo: '14', note: 'Nice' }],
    days: [
      { day: 'Saturday', date: 'Sat 16 May', weather: '22° sunny', icon: 'sun', highlight: 'Terre Bleu', chips: [] },
      { day: 'Sunday', date: 'Sun 17 May', weather: '18° rain', icon: 'rain', highlight: 'Rec Room', chips: [] },
    ],
    anticipations: [
      { icon: 'bag', headline: 'Anything to pick up?', body: 'Add a run.', cta: 'Add an errand', href: '/errand' },
    ],
    quickActions: [
      { kind: 'regenerate', title: 'Regenerate the weekend', subtitle: '', icon: 'refresh' },
      { kind: 'lock', title: "Lock what's already perfect", subtitle: '0 blocks locked', icon: 'lock' },
      { kind: 'share', title: 'Share this weekend', subtitle: '', icon: 'share' },
    ],
    preview: [
      { id: 'c1', kind: 'Commitment', time: '9:00', title: 'Swim', icon: 'lock', locked: true },
      { id: 'b1', kind: 'Activity', time: '11:00', title: 'Terre Bleu', icon: 'tree' },
    ],
    ...overrides,
  };
}

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let weekend: any;
  let router: Router;
  const view = signal(overview());

  beforeEach(async () => {
    view.set(overview());
    mockDialog = { open: vi.fn(() => ({ closed: of('confirm') })) };
    weekend = {
      getOverview: () => view,
      plan: vi.fn(() => Promise.resolve()),
      calendarLinks: vi.fn(() => ({ icsUrl: 'i', webcalUrl: 'w', googleCalendarUrl: 'g' })),
      createShareLink: vi.fn(() => Promise.resolve('https://x/share/1')),
      regenerate: vi.fn(() => Promise.resolve()),
      regenerateDay: vi.fn(() => Promise.resolve()),
      lockBlock: vi.fn(() => Promise.resolve()),
      swapBlock: vi.fn(() => Promise.resolve()),
      setErrandDone: vi.fn(() => Promise.resolve()),
    };

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: WEEKEND_PLAN_SERVICE, useValue: weekend },
        { provide: Dialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('renders the greeting, days and heads-up section', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Morning, Browns 👋');
    expect(el.querySelectorAll('sd-day-card')).toHaveLength(2);
    expect(el.querySelector('sd-anticipate')).not.toBeNull();
    expect(el.textContent).toContain('A heads-up');
  });

  it('hides the heads-up section when there is nothing to say', () => {
    view.set(overview({ anticipations: [] }));
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('A heads-up');
  });

  it('plans the upcoming Saturday using the backend rule', async () => {
    await component['planWeekend']();
    expect(weekend.plan).toHaveBeenCalledWith(upcomingSaturdayIso());
  });

  it('ignores a second plan while one is in flight', async () => {
    component['generating'].set(true);
    await component['planWeekend']();
    expect(weekend.plan).not.toHaveBeenCalled();
  });

  it('dispatches quick actions by kind', async () => {
    component['handleQuickAction']('lock');
    expect(component['lockMode']()).toBe(true);
    component['finishLockMode']();
    component['handleQuickAction']('regenerate');
    await fixture.whenStable();
    expect(weekend.regenerate).toHaveBeenCalled();
    component['handleQuickAction']('share');
    await fixture.whenStable();
    expect(weekend.createShareLink).toHaveBeenCalled();
  });

  it('follows an anticipation CTA to its route', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component['followTip']({ icon: 'bag', headline: '', body: '', href: '/errand' });
    expect(navigate).toHaveBeenCalledWith('/errand');
  });

  it('never toggles a commitment in lock mode', async () => {
    await component['toggleLock']({ id: 'c1', kind: 'Commitment', locked: true, time: '', title: '', icon: '' });
    expect(weekend.lockBlock).not.toHaveBeenCalled();
    await component['toggleLock']({ id: 'b1', kind: 'Activity', time: '', title: '', icon: '' });
    expect(weekend.lockBlock).toHaveBeenCalledWith('b1', true);
  });

  it('renders disabled lock rows for commitments in lock mode', () => {
    component['startLockMode']();
    fixture.detectChanges();
    const rows = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button.lock-block')) as HTMLButtonElement[];
    expect(rows).toHaveLength(2);
    expect(rows[0]!.disabled).toBe(true);
    expect(rows[1]!.disabled).toBe(false);
  });

  it('applies the block sheet result to the weekend', async () => {
    mockDialog.open = vi.fn(() => ({ closed: of({ kind: 'swap' }) }));
    await component['openBlock']({ id: 'b1', kind: 'Activity', time: '', title: '', icon: '' });
    expect(weekend.swapBlock).toHaveBeenCalledWith('b1');
  });

  it('opens the calendar and share dialogs with data', async () => {
    component['openCalendar']();
    expect(mockDialog.open.mock.calls[0][1].data.kind).toBe('calendar');
    await component['openShare']();
    const share = mockDialog.open.mock.calls[1][1].data;
    expect(share).toMatchObject({ kind: 'share', shareUrl: 'https://x/share/1', saturdayHighlight: 'Terre Bleu', sundayHighlight: 'Rec Room' });
  });

  it('regenerates a day after confirmation', async () => {
    await component['regenerateDay']();
    expect(weekend.regenerateDay).toHaveBeenCalledWith('Saturday');
  });

  it('navigates to the itinerary for a day', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component['openItineraryDay']('Sunday');
    expect(navigate).toHaveBeenCalledWith(['/itinerary'], { queryParams: { day: 'sunday' } });
  });
});
