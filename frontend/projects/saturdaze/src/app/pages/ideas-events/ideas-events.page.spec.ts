import { vi } from 'vitest';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EVENTS_SERVICE, IdeasEventsView } from 'api';

import { IdeasEventsPage } from './ideas-events.page';

const VIEW: IdeasEventsView = {
  subtitle: 'What is on within 45 minutes of home.',
  windowChips: [
    { label: 'This weekend', tone: 'primary', active: true },
    { label: 'Next weekend', tone: 'neutral', active: false },
  ],
  categoryChips: [
    { label: 'Festival', tone: 'sun', active: false },
    { label: 'Market', tone: 'leaf', active: true },
  ],
  sections: [
    {
      title: 'Your suggestion',
      subtitle: 'Only you can see it until it is approved.',
      events: [
        {
          id: 's-buskerfest',
          title: 'Port Credit Buskerfest',
          meta: 'Memorial Park · Sat 20 Jun',
          tile: { mon: 'Jun', day: '20' },
          chips: [{ tone: 'sun', label: 'Pending review' }],
          url: 'https://example.com/buskerfest',
          pending: true,
        },
      ],
    },
    {
      title: 'Saturday',
      subtitle: null,
      events: [
        {
          id: 'e-lavender',
          title: 'Lavender Festival',
          meta: 'Milton · Sat 16 May',
          tile: { mon: 'May', day: '16' },
          chips: [
            { tone: 'sun', label: 'Festival' },
            { tone: 'sky', icon: 'car', label: '45 min' },
          ],
          url: 'https://example.com/lavender',
          pending: false,
        },
      ],
    },
  ],
};

describe('IdeasEventsPage', () => {
  let fixture: ComponentFixture<IdeasEventsPage>;
  let host: HTMLElement;
  let view: ReturnType<typeof signal<IdeasEventsView>>;
  let service: {
    list: () => unknown;
    load: ReturnType<typeof vi.fn>;
    setWindow: ReturnType<typeof vi.fn>;
    setCategory: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    view = signal<IdeasEventsView>(VIEW);
    service = { list: () => view, load: vi.fn(async () => undefined), setWindow: vi.fn(), setCategory: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [IdeasEventsPage],
      providers: [provideRouter([]), { provide: EVENTS_SERVICE, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(IdeasEventsPage);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  const chips = (): HTMLElement[] => Array.from(host.querySelectorAll('sd-filter-chip'));

  it('loads events on construction', () => {
    expect(service.load).toHaveBeenCalledTimes(1);
  });

  it('renders the window and category chips either side of a divider', () => {
    expect(chips().map((c) => c.textContent?.trim())).toEqual(['This weekend', 'Next weekend', 'Festival', 'Market']);
    expect(chips().map((c) => c.hasAttribute('pressed'))).toEqual([true, false, false, true]);
    expect(host.querySelectorAll('.sd-vdivider').length).toBe(1);
  });

  it('renders sections with event cards, muting the pending suggestion', () => {
    const sections = Array.from(host.querySelectorAll('sd-section'));
    expect(sections.map((s) => s.getAttribute('title'))).toEqual(['Your suggestion', 'Saturday']);
    expect(sections[0]?.getAttribute('subtitle')).toBe('Only you can see it until it is approved.');

    const cards = Array.from(host.querySelectorAll('sd-event-card'));
    expect(cards.map((c) => c.getAttribute('title'))).toEqual(['Port Credit Buskerfest', 'Lavender Festival']);
    expect(cards[0]?.hasAttribute('muted')).toBe(true);
    expect(cards[0]?.querySelector('.card__footer')).toBeNull();
    expect(cards[1]?.hasAttribute('muted')).toBe(false);
    expect(cards[1]?.querySelector('.card__footer a')?.getAttribute('href')).toBe('https://example.com/lavender');
    expect(cards[1]?.querySelector('sd-date-tile')?.textContent?.replace(/\s+/g, ' ').trim()).toContain('16');
    expect(Array.from(cards[1]!.querySelectorAll('sd-chip')).map((c) => c.textContent?.trim())).toEqual([
      'Festival',
      '45 min',
    ]);
  });

  it('switches the window and toggles a category (off when it is already active)', () => {
    (chips()[1]!.querySelector('button') as HTMLButtonElement).click();
    expect(service.setWindow).toHaveBeenCalledWith('Next weekend');

    (chips()[2]!.querySelector('button') as HTMLButtonElement).click();
    expect(service.setCategory).toHaveBeenCalledWith('Festival');
    (chips()[3]!.querySelector('button') as HTMLButtonElement).click();
    expect(service.setCategory).toHaveBeenLastCalledWith(null);
  });

  it('shows a status row while there is nothing to list', () => {
    view.set({ ...VIEW, sections: [] });
    fixture.detectChanges();
    expect(host.querySelector('sd-status-row')?.textContent?.trim()).toBe('Checking what is on nearby.');
  });
});
