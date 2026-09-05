import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { addDaysIso, upcomingSaturdayIso } from '../api/weekend-dates';
import { ActivityDto } from '../models/activity.dto';
import { WeatherForecastDto } from '../models/weather-forecast.dto';
import { settle } from '../testing/weekend-fixture';
import { ActivityService } from './activity.service';
import { EditableFamilyProfile, FAMILY_SERVICE } from './family.service.contract';

const BASE = 'http://localhost:3000';

const profile = signal<EditableFamilyProfile | null>({
  name: 'The Browns',
  homeLocation: 'Port Credit',
  budgetEnabled: false,
  tryNewEnabled: false,
  fridayPreviewEnabled: true,
  members: [
    { id: 'm1', name: 'Quinn', age: 38 },
    { id: 'm2', name: 'Eli', age: 9 },
    { id: 'm3', name: 'Mae', age: 5 },
  ],
  commitments: [],
  preferences: [],
});

function activity(overrides: Partial<ActivityDto> = {}): ActivityDto {
  return {
    id: 'a1',
    name: 'Terre Bleu Lavender Farm',
    category: 'Outdoor · Farm',
    indoor: false,
    minAge: 0,
    maxAge: 99,
    driveMinutes: 45,
    weatherTags: ['sunny', 'warm'],
    typicalDurationMinutes: 120,
    description: 'Lavender peaks in May.',
    mapUrl: 'https://maps.example.com/terre-bleu',
    ...overrides,
  };
}

const CATALOGUE: ActivityDto[] = [
  activity(),
  activity({
    id: 'a2',
    name: 'Bronte Creek',
    category: 'Outdoor · Park',
    driveMinutes: 25,
    minAge: 5,
  }),
  activity({ id: 'a3', name: 'Royal Botanical Gardens', category: 'Outdoor', driveMinutes: 35 }),
  activity({
    id: 'a4',
    name: 'The Rec Room',
    category: 'Indoor · Arcade',
    indoor: true,
    driveMinutes: 10,
    weatherTags: ['rain'],
  }),
  activity({
    id: 'a5',
    name: 'Ontario Science Centre',
    category: 'Museum',
    indoor: true,
    driveMinutes: 40,
    weatherTags: ['rain', 'cold'],
    mapUrl: '',
  }),
];

const TRY_NEW: ActivityDto[] = [
  activity({ id: 'a6', name: 'Riverwood Conservancy', category: 'Outdoor', driveMinutes: 8 }),
];

function forecast(date: string, tags: string[], hi = 22): WeatherForecastDto {
  return { date, tags, highCelsius: hi, lowCelsius: 12, precipitationMm: 0, unavailable: false };
}

describe('ActivityService', () => {
  let service: ActivityService;
  let httpMock: HttpTestingController;
  const saturday = upcomingSaturdayIso();
  const sunday = addDaysIso(saturday, 1);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ActivityService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: FAMILY_SERVICE, useValue: { getEditableProfile: () => profile } },
      ],
    });
    service = TestBed.inject(ActivityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  /** Answer the constructor's three GETs. */
  async function flushLoad(weather: WeatherForecastDto[] = []): Promise<void> {
    httpMock.expectOne(`${BASE}/api/activities`).flush(CATALOGUE);
    httpMock.expectOne(`${BASE}/api/activities?tryNew=true`).flush(TRY_NEW);
    httpMock.expectOne(`${BASE}/api/weather?weekendOf=${saturday}`).flush(weather);
    await settle();
  }

  it('fetches the catalogue, the try-new picks and the weekend forecast', async () => {
    await flushLoad();
    expect(
      service
        .list()()
        .sections.map((s) => s.title),
    ).toEqual(["Right for this weekend's weather", 'If the weather turns', 'Try something new']);
  });

  it('writes the subtitle from the kids, the home and the longest drive', async () => {
    await flushLoad();
    expect(service.list()().subtitle).toBe(
      'Picked for Eli and Mae, under 45 minutes from Port Credit.',
    );
  });

  it('offers the six filters with All active', async () => {
    await flushLoad();
    const filters = service.list()().filters;
    expect(filters.map((f) => f.label)).toEqual([
      'All',
      'Outdoor',
      'Indoor',
      'Under 30 min',
      'Ages 5+',
      'Weather-safe',
    ]);
    expect(filters.map((f) => f.active)).toEqual([true, false, false, false, false, false]);
    expect(filters[1]!.tone).toBe('leaf');
    expect(filters[5]!.tone).toBe('sky');
  });

  it('leads with outdoor picks on a sunny Saturday and describes both days', async () => {
    await flushLoad([forecast(saturday, ['sunny', 'warm']), forecast(sunday, ['rain'], 15)]);
    const [fit, turns, fresh] = service.list()().sections;
    expect(fit!.subtitle).toBe('Sunny Saturday, 22°');
    expect(fit!.activities.map((a) => a.id)).toEqual(['a1', 'a2', 'a3']);
    expect(turns!.subtitle).toBe('Rainy Sunday, 15°');
    expect(turns!.activities.map((a) => a.id)).toEqual(['a4', 'a5']);
    expect(fresh!.subtitle).toBe('You have not done these recently');
    expect(fresh!.activities[0]!.chips).toContainEqual({ tone: 'primary', label: 'First time' });
  });

  it('leads indoors without a forecast and leaves the subtitles blank', async () => {
    await flushLoad();
    const [fit, turns] = service.list()().sections;
    expect(fit!.subtitle).toBeNull();
    expect(fit!.activities.map((a) => a.id)).toEqual(['a4', 'a5']);
    expect(turns!.subtitle).toBeNull();
    expect(turns!.activities.map((a) => a.id)).toEqual(['a1', 'a2', 'a3']);
  });

  it('builds cards with the drive and ages chips and the map link', async () => {
    await flushLoad([forecast(saturday, ['sunny'])]);
    const cards = service.list()().sections[0]!.activities;
    expect(cards[0]).toMatchObject({
      id: 'a1',
      title: 'Terre Bleu Lavender Farm',
      meta: 'Outdoor · Farm',
      why: 'Lavender peaks in May.',
      icon: 'tree',
      tone: 'outdoor',
      mapUrl: 'https://maps.example.com/terre-bleu',
      chips: [
        { tone: 'sky', icon: 'car', label: '45 min' },
        { tone: 'default', label: 'All ages' },
      ],
    });
    expect(cards[1]!.chips[1]).toEqual({ tone: 'default', label: 'Ages 5+' });
    service.setFilter('Indoor');
    const indoor = service.list()().sections[0]!.activities;
    expect(indoor.find((a) => a.id === 'a5')).toMatchObject({
      icon: 'popcorn',
      tone: 'indoor',
      mapUrl: null,
    });
  });

  it('narrows by filter, drops empty sections and marks the chip active', async () => {
    await flushLoad([forecast(saturday, ['sunny'])]);
    service.setFilter('Indoor');
    const view = service.list()();
    expect(view.filters.find((f) => f.active)?.label).toBe('Indoor');
    // On a sunny Saturday the indoor picks live under "If the weather turns".
    expect(view.sections.map((s) => s.title)).toEqual(['If the weather turns']);
    expect(view.sections[0]!.activities.map((a) => a.id)).toEqual(['a4', 'a5']);

    service.setFilter('Under 30 min');
    expect(
      service
        .list()()
        .sections.flatMap((s) => s.activities.map((a) => a.id)),
    ).toEqual(['a2', 'a4', 'a6']);

    service.setFilter('Weather-safe');
    expect(
      service
        .list()()
        .sections.flatMap((s) => s.activities.map((a) => a.id)),
    ).toEqual(['a4', 'a5']);
  });

  it('falls back to All for an unknown label', async () => {
    await flushLoad();
    service.setFilter('Nope');
    expect(service.list()().filters[0]!.active).toBe(true);
    expect(service.list()().sections).toHaveLength(3);
  });

  it('keeps the previous catalogue when a reload fails', async () => {
    await flushLoad();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const reload = service.load();
    httpMock.expectOne(`${BASE}/api/activities`).flush(null, { status: 500, statusText: 'Boom' });
    httpMock.expectOne(`${BASE}/api/activities?tryNew=true`).flush([]);
    httpMock.expectOne(`${BASE}/api/weather?weekendOf=${saturday}`).flush([]);
    await reload;
    expect(
      service
        .list()()
        .sections.flatMap((s) => s.activities),
    ).toHaveLength(6);
    vi.restoreAllMocks();
  });
});
