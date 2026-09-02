import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import { SAVED_SERVICE, WEEKEND_PLAN_SERVICE, type SavedView, type SavedWeekend } from 'api';
import { SavedPage } from './saved.page';

const weekendA: SavedWeekend = { id: 'w1', weekendOf: '2026-05-16', date: 'May 16–17, 2026', title: 'Bronte + Rec Room', customTitle: null, rating: 0, highlights: 'Frogs', favourite: false };

function view(overrides: Partial<SavedView> = {}): SavedView {
  return {
    heading: 'Your weekends',
    lede: '1 weekend planned.',
    filters: [{ label: 'All', tone: 'primary' }, { label: 'Favourites', icon: 'heart', tone: 'accent' }],
    recent: [weekendA],
    avoid: [],
    ...overrides,
  };
}

describe('SavedPage', () => {
  let component: SavedPage;
  let fixture: ComponentFixture<SavedPage>;
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let saved: any;
  let weekend: any;
  const current = signal(view());
  const filter = signal('All');

  beforeEach(async () => {
    current.set(view());
    filter.set('All');
    mockDialog = { open: vi.fn(() => ({ closed: of('confirm') })) };
    saved = {
      list: () => current,
      activeFilter: () => filter,
      setFilter: vi.fn((l: string) => filter.set(l)),
      setFavourite: vi.fn(() => Promise.resolve()),
      rate: vi.fn(() => Promise.resolve()),
      rename: vi.fn(() => Promise.resolve()),
    };
    weekend = { remixSaved: vi.fn(() => Promise.resolve()), repeatSaved: vi.fn(() => Promise.resolve()) };

    await TestBed.configureTestingModule({
      imports: [SavedPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: SAVED_SERVICE, useValue: saved },
        { provide: WEEKEND_PLAN_SERVICE, useValue: weekend },
        { provide: Dialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SavedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a card with Remix, Repeat and Rate and hides the empty avoid section', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('sd-saved-card')).toHaveLength(1);
    const labels = Array.from(el.querySelectorAll('sd-saved-card sd-button')).map((b) => b.textContent?.trim());
    expect(labels).toEqual(['Remix', 'Repeat', 'Rate']);
    expect(el.textContent).not.toContain('Avoid repeating');
    expect(el.querySelector('sd-empty')).toBeNull();
  });

  it('shows the empty state when nothing is saved and the avoid list when needed', () => {
    current.set(view({ recent: [], avoid: [{ title: 'Rec Room', subtitle: 'Last visit: May 10–11, 2026', icon: 'refresh' }] }));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('sd-empty')).not.toBeNull();
    expect(el.textContent).toContain('No weekends yet');
    expect(el.textContent).toContain('Avoid repeating');
    expect(el.textContent).toContain('Rec Room');
  });

  it('wires the chips to the service filter', () => {
    const chips = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('sd-tag-group sd-chip')) as HTMLElement[];
    chips[1]!.click();
    expect(saved.setFilter).toHaveBeenCalledWith('Favourites');
  });

  it('toggles the favourite through the heart', async () => {
    const heart = (fixture.nativeElement as HTMLElement).querySelector('sd-saved-card button.heart') as HTMLButtonElement;
    heart.click();
    await fixture.whenStable();
    expect(saved.setFavourite).toHaveBeenCalledWith('w1', true);
  });

  it('rates and renames from the rating sheet, skipping unchanged values', async () => {
    mockDialog.open = vi.fn(() => ({ closed: of({ rating: 5, title: 'Lavender' }) }));
    await component['openRating'](weekendA);
    expect(mockDialog.open.mock.calls[0][1].data).toEqual({ weekendTitle: 'Bronte + Rec Room', rating: null, title: null });
    expect(saved.rate).toHaveBeenCalledWith('w1', 5);
    expect(saved.rename).toHaveBeenCalledWith('w1', 'Lavender');

    saved.rate.mockClear();
    saved.rename.mockClear();
    mockDialog.open = vi.fn(() => ({ closed: of({ rating: null, title: null }) }));
    await component['openRating'](weekendA);
    expect(saved.rate).not.toHaveBeenCalled();
    expect(saved.rename).not.toHaveBeenCalled();
  });

  it('reports a failed rating', async () => {
    mockDialog.open = vi.fn(() => ({ closed: of({ rating: 2, title: null }) }));
    saved.rate = vi.fn(() => Promise.reject(new Error('boom')));
    await component['openRating'](weekendA);
    expect(component['error']()).toMatch(/Couldn't save the rating/);
  });

  it('remixes and repeats after confirmation, then goes home', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await component['remix']('w1', 'x');
    expect(weekend.remixSaved).toHaveBeenCalledWith('w1');
    await component['repeat']('w1', 'x');
    expect(weekend.repeatSaved).toHaveBeenCalledWith('w1');
    expect(navigate).toHaveBeenCalledTimes(2);
  });

  it('opens the more sheet', () => {
    component['openMore']();
    expect(mockDialog.open.mock.calls[0][1].data).toEqual({ kind: 'saved-more' });
  });
});
