import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { EVENTS_SERVICE, EVENT_SUBMISSIONS_SERVICE, type EventsView } from 'api';
import { EventsPage } from './events.page';

describe('EventsPage', () => {
  let component: EventsPage;
  let fixture: ComponentFixture<EventsPage>;
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let events: any;
  let submissions: any;
  const view = signal<EventsView>({
    heading: "What's on this weekend",
    lede: 'Close to home.',
    filters: [
      { label: 'This weekend', tone: 'primary' },
      { label: 'Seasonal', tone: 'sun' },
    ],
    sections: [
      { title: 'Saturday', events: [{ title: 'Terre Bleu', venue: 'Milton', when: 'Sat · all day', drive: '45 min', dateDay: '16', dateMon: 'MAY', tag: 'Seasonal' }] },
      { title: 'Sunday', events: [] },
    ],
  });
  const filter = signal('This weekend');
  const mine = signal<any[]>([
    { id: 's1', title: 'Buskerfest', startsAtLocal: '2026-05-16T14:00', location: 'Port Credit', status: 'Pending' },
    { id: 's2', title: 'Old', startsAtLocal: '2026-05-16T14:00', location: null, status: 'Approved' },
  ]);

  beforeEach(async () => {
    mockDialog = { open: vi.fn() };
    events = { list: () => view, activeFilter: () => filter, setFilter: vi.fn((l: string) => filter.set(l)), load: vi.fn(() => Promise.resolve()) };
    submissions = { mine: () => mine, loadMine: vi.fn(() => Promise.resolve()) };

    await TestBed.configureTestingModule({
      imports: [EventsPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: EVENT_SUBMISSIONS_SERVICE, useValue: submissions },
        { provide: EVENTS_SERVICE, useValue: events },
        { provide: Dialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('reloads events and submissions on init', () => {
    expect(events.load).toHaveBeenCalled();
    expect(submissions.loadMine).toHaveBeenCalled();
  });

  it('renders sections, the empty note and only pending submissions', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('sd-event-card')).toHaveLength(2);
    expect(el.textContent).toContain('Nothing listed yet.');
    expect(component['myPending']()).toHaveLength(1);
    expect(component['myPending']()[0]).toMatchObject({ title: 'Buskerfest', venue: 'Port Credit · submitted by you', dateDay: '16', dateMon: 'MAY' });
  });

  it('wires the chips to the service filter', () => {
    const chips = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('sd-tag-group sd-chip')) as HTMLElement[];
    expect(chips[0]!.getAttribute('aria-pressed')).toBe('true');
    chips[1]!.click();
    expect(events.setFilter).toHaveBeenCalledWith('Seasonal');
    fixture.detectChanges();
    expect(chips[1]!.getAttribute('aria-pressed')).toBe('true');
  });

  it('opens the quick-add sheet', () => {
    component['openQuickAdd']();
    expect(mockDialog.open).toHaveBeenCalled();
  });
});
