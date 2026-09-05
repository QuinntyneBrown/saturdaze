import { vi } from 'vitest';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { FoodCard, IdeasFoodView, RESTAURANT_SERVICE } from 'api';

import { LockRestaurantDialog } from '../../dialogs/lock-restaurant-dialog/lock-restaurant-dialog';
import { FOOD_CARD } from '../dialogs/dialog-fixtures';
import { IdeasFoodPage } from './ideas-food.page';

const LA_MARINA: FoodCard = {
  ...FOOD_CARD,
  votes: [
    { name: 'Quinn', initial: 'Q', tone: 'primary', vote: 'up' },
    { name: 'Sara', initial: 'S', tone: 'leaf', vote: 'none' },
  ],
};

const PIZZA: FoodCard = {
  id: 'r-pizza',
  name: 'Pizza Nova',
  meta: 'Pizza · 4 min from home',
  chips: [],
  votes: [],
  menuUrl: null,
  topPick: false,
  locked: false,
  lockedLabel: null,
  dimmed: false,
  votesDisabled: false,
};

const VIEW: IdeasFoodView = {
  subtitle: 'Places to eat near what you are already doing.',
  dayChips: [
    { label: 'Saturday', tone: 'primary', active: true },
    { label: 'Sunday', tone: 'neutral', active: false },
  ],
  slotChips: [
    { label: 'Lunch', tone: 'sun', active: false },
    { label: 'Dinner', tone: 'sun', active: true },
  ],
  extraChips: [
    { label: 'Wife-approved', tone: 'accent', icon: 'heart', active: false },
    { label: 'Under 15 min', tone: 'sky', icon: 'car', active: true },
  ],
  sections: [
    {
      title: 'Lunch',
      subtitle: 'Near Terre Bleu · 12:00 to 1:30pm',
      day: 'Saturday',
      slot: 'Lunch',
      lockedId: null,
      picks: [LA_MARINA, PIZZA],
    },
  ],
};

/** Flush every pending microtask (the app is zoneless, so whenStable cannot see mocked promises). */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('IdeasFoodPage', () => {
  let fixture: ComponentFixture<IdeasFoodPage>;
  let host: HTMLElement;
  let view: ReturnType<typeof signal<IdeasFoodView>>;
  let service: any;
  let dialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    view = signal<IdeasFoodView>(VIEW);
    service = {
      list: () => view,
      load: vi.fn(async () => undefined),
      setFilters: vi.fn(),
      vote: vi.fn(async () => undefined),
      lock: vi.fn(async () => undefined),
    };
    dialog = { open: vi.fn(() => ({ closed: of(undefined) })) };
    await TestBed.configureTestingModule({
      imports: [IdeasFoodPage],
      providers: [
        provideRouter([]),
        { provide: RESTAURANT_SERVICE, useValue: service },
        { provide: Dialog, useValue: dialog },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(IdeasFoodPage);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  const chipButton = (label: string): HTMLButtonElement =>
    Array.from(host.querySelectorAll('sd-filter-chip'))
      .find((c) => c.textContent?.trim() === label)!
      .querySelector('button') as HTMLButtonElement;
  const card = (title: string): HTMLElement => host.querySelector(`sd-food-card[title="${title}"]`) as HTMLElement;

  it('loads both days on construction and renders the three chip rows', () => {
    expect(service.load).toHaveBeenCalledTimes(1);
    const chips = Array.from(host.querySelectorAll('sd-filter-chip'));
    expect(chips.map((c) => c.textContent?.trim())).toEqual([
      'Saturday',
      'Sunday',
      'Lunch',
      'Dinner',
      'Wife-approved',
      'Under 15 min',
    ]);
    expect(chips.map((c) => c.hasAttribute('pressed'))).toEqual([true, false, false, true, false, true]);
    expect(host.querySelectorAll('.sd-vdivider').length).toBe(2);
  });

  it('renders the meal section with the top pick spanning and the family vote row', () => {
    const section = host.querySelector('sd-section');
    expect(section?.getAttribute('title')).toBe('Lunch');
    expect(section?.getAttribute('subtitle')).toBe('Near Terre Bleu · 12:00 to 1:30pm');
    expect(card('La Marina').hasAttribute('top-pick')).toBe(true);
    expect(card('La Marina').classList.contains('card--span')).toBe(true);
    expect(card('Pizza Nova').hasAttribute('top-pick')).toBe(false);
    expect(Array.from(card('La Marina').querySelectorAll('sd-chip')).map((c) => c.textContent?.trim())).toEqual([
      'Top pick',
      'Wife-approved',
      '3 of 4 yes',
    ]);
    expect(card('La Marina').querySelectorAll('.vote-row__cell').length).toBe(2);
    expect(card('Pizza Nova').querySelector('sd-vote-row')).toBeNull();
    expect(card('La Marina').querySelector('a[href="https://example.com/la-marina/menu"]')).not.toBeNull();
  });

  it('changes the day, toggles the slot and the extras', () => {
    chipButton('Sunday').click();
    expect(service.setFilters).toHaveBeenCalledWith({ day: 'Sunday' });
    chipButton('Lunch').click();
    expect(service.setFilters).toHaveBeenCalledWith({ slot: 'Lunch' });
    chipButton('Dinner').click();
    expect(service.setFilters).toHaveBeenCalledWith({ slot: null });
    chipButton('Wife-approved').click();
    expect(service.setFilters).toHaveBeenCalledWith({ wifeApproved: true });
    chipButton('Under 15 min').click();
    expect(service.setFilters).toHaveBeenCalledWith({ quick: false });
  });

  it('casts a family vote by name, clearing it when the same thumb is pressed again', async () => {
    (card('La Marina').querySelector('button[aria-label="Sara votes no"]') as HTMLButtonElement).click();
    await settle();
    expect(service.vote).toHaveBeenCalledWith('r-la-marina', 'Sara', 'down');

    (card('La Marina').querySelector('button[aria-label="Quinn votes yes"]') as HTMLButtonElement).click();
    await settle();
    expect(service.vote).toHaveBeenLastCalledWith('r-la-marina', 'Quinn', 'none');
  });

  it('locks a pick for the section day and meal after D12 confirms', async () => {
    dialog.open.mockReturnValueOnce({ closed: of('confirm') });
    (card('La Marina').querySelector('.card__footer sd-button[variant="primary"] button') as HTMLButtonElement).click();
    await settle();
    expect(dialog.open).toHaveBeenCalledWith(
      LockRestaurantDialog,
      expect.objectContaining({ data: { card: LA_MARINA, day: 'Saturday', slot: 'Lunch' } }),
    );
    expect(service.lock).toHaveBeenCalledWith('r-la-marina', 'Saturday', 'Lunch');

    (card('Pizza Nova').querySelector('.card__footer sd-button[variant="primary"] button') as HTMLButtonElement).click();
    await settle();
    expect(service.lock).toHaveBeenCalledTimes(1);
  });

  it('shows a warn banner when a vote fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    service.vote.mockRejectedValueOnce(new Error('500'));
    (card('La Marina').querySelector('button[aria-label="Sara votes yes"]') as HTMLButtonElement).click();
    await settle();
    fixture.detectChanges();
    expect(host.querySelector('sd-banner.error')?.textContent?.trim()).toBe(
      'That did not go through. Try again in a moment.',
    );
    consoleError.mockRestore();
  });

  it('shows a status row while there are no sections', () => {
    view.set({ ...VIEW, sections: [] });
    fixture.detectChanges();
    expect(host.querySelector('sd-status-row')?.textContent?.trim()).toBe('Finding places to eat near your weekend.');
  });
});
