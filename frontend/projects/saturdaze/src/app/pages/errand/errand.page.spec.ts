import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { WEEKEND_PLAN_SERVICE, type ErrandPlacement } from 'api';
import { ERRAND_REDIRECT_MS, ErrandPage } from './errand.page';

describe('ErrandPage', () => {
  let component: ErrandPage;
  let fixture: ComponentFixture<ErrandPage>;
  let weekend: any;
  let router: Router;
  const placement = signal<ErrandPlacement | null>(null);

  beforeEach(async () => {
    placement.set(null);
    weekend = {
      addErrand: vi.fn(() => Promise.resolve()),
      lastErrandPlacement: () => placement,
    };

    await TestBed.configureTestingModule({
      imports: [ErrandPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: WEEKEND_PLAN_SERVICE, useValue: weekend },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrandPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with an empty description and no preferred day', () => {
    expect(component['form'].controls.description.value).toBe('');
    expect(component['preferredDay']()).toBeNull();
    const chips = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('sd-chip[role="radio"]'));
    expect(chips.map((c) => c.textContent?.trim())).toEqual(['Saturday', 'Sunday', "Doesn't matter"]);
    expect(chips[2]!.getAttribute('aria-checked')).toBe('true');
  });

  it('refuses to submit an invalid form', async () => {
    await component['addToWeekend']();
    expect(weekend.addErrand).not.toHaveBeenCalled();
  });

  it('sends exactly one POST with the preferred day, shows the placement, then returns home', async () => {
    vi.useFakeTimers();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component['form'].setValue({ description: 'Costco run', duration: '45' });
    component['choosePreferredDay']('Sunday');
    weekend.addErrand = vi.fn(() => {
      placement.set({ description: 'Costco run', day: 'Sunday', time: '9:15' });
      return Promise.resolve();
    });

    await component['addToWeekend']();
    expect(weekend.addErrand).toHaveBeenCalledTimes(1);
    expect(weekend.addErrand).toHaveBeenCalledWith('Costco run', 45, 'Sunday');
    expect(component['added']()).toBe(true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Slotted for Sunday at 9:15');
    expect(navigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(ERRAND_REDIRECT_MS);
    expect(navigate).toHaveBeenCalledWith('/weekend');
  });

  it('surfaces a failure and stays on the page', async () => {
    weekend.addErrand = vi.fn(() => Promise.reject(new Error('boom')));
    component['form'].setValue({ description: 'Costco run', duration: '45' });
    await component['addToWeekend']();
    expect(component['added']()).toBe(false);
    expect(component['error']()).toMatch(/Couldn't add/);
  });

  it('goes back to the weekend immediately on demand', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component['backToWeekend']();
    expect(navigate).toHaveBeenCalledWith('/weekend');
  });
});
