import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../api/api-base-url';
import { FamilyDto } from '../models/family.dto';
import { settle } from '../testing/weekend-fixture';
import { FamilyService } from './family.service';

const BASE = 'http://localhost:3000';
const FAMILY = `${BASE}/api/family`;

function family(overrides: Partial<FamilyDto> = {}): FamilyDto {
  return {
    id: 'f1',
    name: 'The Browns',
    homeLocation: 'Port Credit',
    budgetEnabled: false,
    tryNewEnabled: true,
    fridayPreviewEnabled: false,
    members: [
      { id: 'm3', name: 'Mae', age: 5 },
      { id: 'm1', name: 'Quinn', age: 38 },
      { id: 'm4', name: 'Eli', age: 9 },
      { id: 'm2', name: 'Sara', age: 36 },
    ],
    commitments: [
      {
        id: 'c1',
        title: 'Swim lessons',
        dayOfWeek: 'Saturday',
        startTime: '09:00:00',
        endTime: '10:00:00',
      },
      {
        id: 'c2',
        title: 'Church',
        dayOfWeek: 'Sunday',
        startTime: '10:30:00',
        endTime: '11:45:00',
      },
      {
        id: 'c3',
        title: 'Workout window',
        dayOfWeek: 'Saturday',
        startTime: '17:00:00',
        endTime: '18:00:00',
      },
    ],
    preferences: [
      { id: 'p1', kind: 'Like', value: 'Parks' },
      { id: 'p2', kind: 'Like', value: 'Theatre' },
      { id: 'p3', kind: 'Like', value: 'Zoo' },
      { id: 'p4', kind: 'Dislike', value: 'Camping' },
      { id: 'p5', kind: 'Dislike', value: 'Drives over 60 min' },
    ],
    ...overrides,
  };
}

describe('FamilyService', () => {
  let service: FamilyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FamilyService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(FamilyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  async function flushLoad(dto: FamilyDto = family()): Promise<void> {
    httpMock.expectOne(FAMILY).flush(dto);
    await settle();
  }

  it('renders a neutral placeholder until the family loads', () => {
    const view = service.getFamily()();
    expect(view.status).toBe('loading');
    expect(view.headline).toBe('Your family');
    expect(view.members).toEqual([]);
    expect(view.preferences.map((p) => p.checked)).toEqual([false, false, true]);
    expect(service.getEditableProfile()()).toBeNull();
    httpMock.expectOne(FAMILY).flush(family());
  });

  it('projects the headline, subtitle and home', async () => {
    await flushLoad();
    const view = service.getFamily()();
    expect(view.status).toBe('ready');
    expect(view.headline).toBe('The Browns');
    expect(view.subtitle).toBe('Port Credit. Every weekend is planned around this.');
    expect(view.home).toEqual({
      location: 'Port Credit',
      hint: 'Weather and drive times start here',
    });
  });

  it('lists members oldest first with a derived role', async () => {
    await flushLoad();
    expect(service.getFamily()().members).toEqual([
      {
        id: 'm1',
        name: 'Quinn',
        initial: 'Q',
        tone: 'primary',
        age: 38,
        role: 'Parent',
        subtitle: 'Parent · 38',
      },
      {
        id: 'm2',
        name: 'Sara',
        initial: 'S',
        tone: 'leaf',
        age: 36,
        role: 'Parent',
        subtitle: 'Parent · 36',
      },
      {
        id: 'm4',
        name: 'Eli',
        initial: 'E',
        tone: 'sky',
        age: 9,
        role: 'Kid',
        subtitle: 'Kid · 9',
      },
      {
        id: 'm3',
        name: 'Mae',
        initial: 'M',
        tone: 'sun',
        age: 5,
        role: 'Kid',
        subtitle: 'Kid · 5',
      },
    ]);
  });

  it('keeps one commitment row per backend row', async () => {
    await flushLoad();
    expect(service.getFamily()().commitments).toEqual([
      {
        id: 'c1',
        title: 'Swim lessons',
        dayOfWeek: 'Saturday',
        dayLabel: 'Saturdays',
        startTime: '09:00',
        endTime: '10:00',
        subtitle: 'Saturdays · 9:00 to 10:00',
        icon: 'lock',
      },
      {
        id: 'c2',
        title: 'Church',
        dayOfWeek: 'Sunday',
        dayLabel: 'Sundays',
        startTime: '10:30',
        endTime: '11:45',
        subtitle: 'Sundays · 10:30 to 11:45',
        icon: 'lock',
      },
      {
        id: 'c3',
        title: 'Workout window',
        dayOfWeek: 'Saturday',
        dayLabel: 'Saturdays',
        startTime: '17:00',
        endTime: '18:00',
        subtitle: 'Saturdays · 5:00 to 6:00pm',
        icon: 'lock',
      },
    ]);
  });

  it('splits likes and dislikes into chips and phrases the toggles', async () => {
    await flushLoad();
    const view = service.getFamily()();
    expect(view.likes).toEqual([
      { tone: 'leaf', icon: 'heart', label: 'Parks' },
      { tone: 'leaf', icon: 'heart', label: 'Theatre' },
      { tone: 'leaf', icon: 'heart', label: 'Zoo' },
    ]);
    expect(view.dislikes).toEqual([
      { tone: 'warn', icon: 'close', label: 'Camping' },
      { tone: 'warn', icon: 'close', label: 'Drives over 60 min' },
    ]);
    expect(view.preferences).toEqual([
      {
        key: 'budget',
        title: 'Budget matters',
        subtitle: 'Prefer free and low-cost picks',
        checked: false,
      },
      {
        key: 'tryNew',
        title: 'Try something new each weekend',
        subtitle: 'One first-time activity per weekend',
        checked: true,
      },
      {
        key: 'fridayPreview',
        title: 'Friday preview email',
        subtitle: 'A draft in your inbox at 6pm Friday',
        checked: false,
      },
    ]);
  });

  it('builds the three planned-around rows for the empty weekend', async () => {
    await flushLoad();
    expect(service.getFamily()().plannedAround).toEqual([
      {
        icon: 'user',
        title: 'The Browns, Port Credit',
        subtitle: '2 parents · Eli 9 · Mae 5',
        href: '/family',
      },
      {
        icon: 'lock',
        title: '3 commitments',
        subtitle: 'Swim lessons Sat 9:00 · Church Sun 10:30 · Workout window Sat 17:00',
        href: '/family',
      },
      {
        icon: 'heart',
        title: 'Likes parks and theatre',
        subtitle: 'No camping · drives over 60 min',
        href: '/family',
      },
    ]);
  });

  it('falls back when the family is unnamed, homeless, and has nothing set', async () => {
    await flushLoad(
      family({ name: '  ', homeLocation: '', commitments: [], preferences: [], members: [] }),
    );
    const view = service.getFamily()();
    expect(view.headline).toBe('Your family');
    expect(view.subtitle).toBe('Every weekend is planned around this.');
    expect(view.plannedAround.map((r) => [r.title, r.subtitle])).toEqual([
      ['Your family', 'Nobody added yet'],
      ['No commitments', 'Add swim, church or anything fixed'],
      ['No likes yet', 'Nothing ruled out'],
    ]);
  });

  it('exposes the editable profile with HH:mm times and oldest-first members', async () => {
    await flushLoad();
    const editable = service.getEditableProfile()()!;
    expect(editable).toMatchObject({
      name: 'The Browns',
      tryNewEnabled: true,
      fridayPreviewEnabled: false,
    });
    expect(editable.members.map((m) => m.id)).toEqual(['m1', 'm2', 'm4', 'm3']);
    expect(editable.commitments[0]).toEqual({
      id: 'c1',
      title: 'Swim lessons',
      dayOfWeek: 'Saturday',
      startTime: '09:00',
      endTime: '10:00',
    });
    expect(editable.preferences).toHaveLength(5);
  });

  it('PUTs the full profile with ids, trimmed names and seconds on times, then applies the reply', async () => {
    await flushLoad();
    const promise = service.saveProfile({
      name: ' The Browns ',
      homeLocation: 'Port Credit',
      budgetEnabled: true,
      tryNewEnabled: false,
      fridayPreviewEnabled: true,
      members: [
        { id: 'm1', name: ' Quinn ', age: 39 },
        { name: 'New', age: 1 },
      ],
      commitments: [
        { id: 'c1', title: ' Swim ', dayOfWeek: 'Saturday', startTime: '09:00', endTime: '10:00' },
      ],
      preferences: [{ kind: 'Like', value: 'Hiking' }],
    });
    const req = httpMock.expectOne(FAMILY);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      name: 'The Browns',
      homeLocation: 'Port Credit',
      budgetEnabled: true,
      tryNewEnabled: false,
      fridayPreviewEnabled: true,
      members: [
        { id: 'm1', name: 'Quinn', age: 39 },
        { id: null, name: 'New', age: 1 },
      ],
      commitments: [
        {
          id: 'c1',
          title: 'Swim',
          dayOfWeek: 'Saturday',
          startTime: '09:00:00',
          endTime: '10:00:00',
        },
      ],
      preferences: [{ kind: 'Like', value: 'Hiking' }],
    });
    req.flush(family({ budgetEnabled: true, name: 'The Browns' }));
    await promise;
    expect(service.getFamily()().preferences[0]!.checked).toBe(true);
  });

  it('rejects a failed save and keeps the previous family', async () => {
    await flushLoad();
    const promise = service.saveProfile(service.getEditableProfile()()!);
    promise.catch(() => undefined);
    httpMock
      .expectOne(FAMILY)
      .flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });
    await expect(promise).rejects.toBeTruthy();
    expect(service.getFamily()().headline).toBe('The Browns');
  });
});
