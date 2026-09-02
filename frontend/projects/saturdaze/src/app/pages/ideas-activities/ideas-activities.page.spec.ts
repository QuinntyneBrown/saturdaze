import { vi } from 'vitest';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ACTIVITY_SERVICE, IdeasActivitiesView } from 'api';

import { IdeasActivitiesPage } from './ideas-activities.page';

const VIEW: IdeasActivitiesView = {
  subtitle: 'Picked for Eli and Mae, under 45 minutes from Port Credit.',
  filters: [
    { label: 'All', tone: 'neutral', active: true },
    { label: 'Outdoor', tone: 'leaf', icon: 'tree', active: false },
    { label: 'Indoor', tone: 'indoor', active: false },
  ],
  sections: [
    {
      title: "Right for this weekend's weather",
      subtitle: 'Sunny Saturday, 22°.',
      activities: [
        {
          id: 'a-lavender',
          title: 'Terre Bleu Lavender Farm',
          meta: 'Farm · Milton',
          why: 'Lavender peaks this week.',
          icon: 'tree',
          tone: 'outdoor',
          chips: [
            { tone: 'sky', icon: 'car', label: '45 min drive' },
            { tone: 'neutral', label: 'Ages 3+' },
          ],
          mapUrl: 'https://maps.example/terre-bleu',
        },
      ],
    },
    {
      title: 'Try something new',
      subtitle: null,
      activities: [
        {
          id: 'a-rec-room',
          title: 'The Rec Room',
          meta: 'Arcade · Mississauga',
          why: 'Rainy-day backup.',
          icon: 'popcorn',
          tone: 'indoor',
          chips: [{ tone: 'primary', label: 'First time' }],
          mapUrl: null,
        },
      ],
    },
  ],
};

describe('IdeasActivitiesPage', () => {
  let fixture: ComponentFixture<IdeasActivitiesPage>;
  let host: HTMLElement;
  let view: ReturnType<typeof signal<IdeasActivitiesView>>;
  let service: { list: () => unknown; load: ReturnType<typeof vi.fn>; setFilter: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    view = signal<IdeasActivitiesView>(VIEW);
    service = { list: () => view, load: vi.fn(async () => undefined), setFilter: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [IdeasActivitiesPage],
      providers: [provideRouter([]), { provide: ACTIVITY_SERVICE, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(IdeasActivitiesPage);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('loads the catalogue on construction', () => {
    expect(service.load).toHaveBeenCalledTimes(1);
  });

  it('renders the filter strip with the active chip pressed', () => {
    const chips = Array.from(host.querySelectorAll('sd-filter-chip'));
    expect(chips.map((c) => c.textContent?.trim())).toEqual(['All', 'Outdoor', 'Indoor']);
    expect(chips.map((c) => c.hasAttribute('pressed'))).toEqual([true, false, false]);
    expect(chips.map((c) => c.getAttribute('tone'))).toEqual([null, 'leaf', 'indoor']);
    expect(chips[1]?.querySelector('sd-icon')?.getAttribute('name')).toBe('tree');
  });

  it('renders each section with its activity cards, chips and map link', () => {
    const sections = Array.from(host.querySelectorAll('sd-section'));
    expect(sections.map((s) => s.getAttribute('title'))).toEqual([
      "Right for this weekend's weather",
      'Try something new',
    ]);
    expect(sections[0]?.getAttribute('subtitle')).toBe('Sunny Saturday, 22°.');
    expect(sections[1]?.getAttribute('subtitle')).toBeNull();

    const cards = Array.from(host.querySelectorAll('sd-activity-card'));
    expect(cards.map((c) => c.getAttribute('title'))).toEqual(['Terre Bleu Lavender Farm', 'The Rec Room']);
    expect(cards.map((c) => c.getAttribute('tone'))).toEqual(['leaf', 'indoor']);
    expect(Array.from(cards[0]!.querySelectorAll('sd-chip')).map((c) => c.textContent?.trim())).toEqual([
      '45 min drive',
      'Ages 3+',
    ]);
    expect(cards[0]?.querySelector('.card__footer a')?.getAttribute('href')).toBe('https://maps.example/terre-bleu');
    expect(cards[1]?.querySelector('.card__footer')).toBeNull();
    expect(host.querySelector('sd-status-row')).toBeNull();
  });

  it('sends the chip label back to the service when pressed', () => {
    (host.querySelectorAll('sd-filter-chip button')[1] as HTMLButtonElement).click();
    expect(service.setFilter).toHaveBeenCalledWith('Outdoor');
    (host.querySelectorAll('sd-filter-chip button')[0] as HTMLButtonElement).click();
    expect(service.setFilter).toHaveBeenLastCalledWith('All');
  });

  it('shows a status row while there are no sections', () => {
    view.set({ ...VIEW, sections: [] });
    fixture.detectChanges();
    expect(host.querySelector('sd-status-row')?.textContent?.trim()).toBe('Looking for ideas near you.');
    expect(host.querySelectorAll('sd-activity-card').length).toBe(0);
  });
});
