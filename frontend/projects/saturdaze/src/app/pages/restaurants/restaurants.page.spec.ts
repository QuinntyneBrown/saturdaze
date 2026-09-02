import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import { RESTAURANT_SERVICE, type RestaurantView } from 'api';
import { RestaurantsPage } from './restaurants.page';

describe('RestaurantsPage', () => {
  let component: RestaurantsPage;
  let fixture: ComponentFixture<RestaurantsPage>;
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let restaurants: any;
  const pick = { id: 'r1', name: 'La Marina', style: 'Italian', drive: '6 min', wifeapproved: true, menuUrl: 'https://menu', locked: false, votes: [{ name: 'Quinn', tone: 'primary' as const, vote: 'none' as const }] };
  const view = signal<RestaurantView>({
    title: 'Saturday food',
    lede: 'Lock a pick.',
    filters: [{ label: 'Lunch', tone: 'primary' }, { label: 'Dinner', tone: 'default' }],
    topPickSection: { title: 'Top pick for lunch', day: 'Saturday', slot: 'Lunch', picks: [pick] },
    otherPicks: { title: 'Other strong picks', day: 'Saturday', slot: 'Lunch', picks: [{ ...pick, id: 'r2', name: 'Cora' }] },
    sundayDinner: { title: 'Sunday dinner', day: 'Sunday', slot: 'Dinner', picks: [{ ...pick, id: 'r3', name: 'Jack' }] },
  });
  const filter = signal('Lunch');

  beforeEach(async () => {
    mockDialog = { open: vi.fn(() => ({ closed: of('confirm') })) };
    restaurants = {
      list: () => view,
      activeFilter: () => filter,
      setFilter: vi.fn((l: string) => filter.set(l)),
      refresh: vi.fn(() => Promise.resolve()),
      vote: vi.fn(() => Promise.resolve()),
      lock: vi.fn(() => Promise.resolve()),
    };

    await TestBed.configureTestingModule({
      imports: [RestaurantsPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: RESTAURANT_SERVICE, useValue: restaurants },
        { provide: Dialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RestaurantsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the three sections and the menu link as an anchor', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('sd-restaurant-card')).toHaveLength(3);
    expect((el.querySelector('a.menu-link') as HTMLAnchorElement).href).toBe('https://menu/');
  });

  it('wires the chips to the service filter', () => {
    const chips = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('sd-tag-group sd-chip')) as HTMLElement[];
    chips[1]!.click();
    expect(restaurants.setFilter).toHaveBeenCalledWith('Dinner');
  });

  it('refreshes once at a time', async () => {
    component['refreshing'].set(true);
    await component['refreshPicks']();
    expect(restaurants.refresh).not.toHaveBeenCalled();
    component['refreshing'].set(false);
    await component['refreshPicks']();
    expect(restaurants.refresh).toHaveBeenCalledTimes(1);
    expect(component['refreshing']()).toBe(false);
  });

  it('votes only for restaurants with an id', () => {
    component['vote'](undefined, 'Quinn', 'up');
    expect(restaurants.vote).not.toHaveBeenCalled();
    component['vote']('r1', 'Quinn', 'up');
    expect(restaurants.vote).toHaveBeenCalledWith('r1', 'Quinn', 'up');
  });

  it('locks a pick for the section day + slot after confirmation', async () => {
    await component['lockRestaurant'](view().sundayDinner.picks[0]!, view().sundayDinner);
    expect(mockDialog.open.mock.calls[0][1].data).toMatchObject({ kind: 'restaurant-lock', restaurant: 'Jack', day: 'Sunday', slot: 'Dinner' });
    expect(restaurants.lock).toHaveBeenCalledWith('r3', 'Sunday', 'Dinner');
  });

  it('does nothing when the lock is declined', async () => {
    mockDialog.open = vi.fn(() => ({ closed: of(undefined) }));
    await component['lockRestaurant'](pick, view().topPickSection);
    expect(restaurants.lock).not.toHaveBeenCalled();
  });
});
