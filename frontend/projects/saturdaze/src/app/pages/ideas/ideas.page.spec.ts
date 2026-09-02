import { vi } from 'vitest';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ACTIVITY_SERVICE, EVENTS_SERVICE, EVENT_SUBMISSIONS_SERVICE, RESTAURANT_SERVICE } from 'api';

import { EventSubmittedDialog } from '../../dialogs/event-submitted-dialog/event-submitted-dialog';
import { SubmitEventDialog } from '../../dialogs/submit-event-dialog/submit-event-dialog';
import { SUBMISSION } from '../dialogs/dialog-fixtures';
import { IdeasPage } from './ideas.page';

describe('IdeasPage', () => {
  let fixture: ComponentFixture<IdeasPage>;
  let component: IdeasPage;
  let host: HTMLElement;
  let router: Router;
  let dialog: { open: ReturnType<typeof vi.fn> };
  let submissions: { loadMine: ReturnType<typeof vi.fn> };
  const activitiesView = signal({ subtitle: 'Picked for Eli and Mae, under 45 minutes from Port Credit.', filters: [], sections: [] });
  const foodView = signal({ subtitle: '', dayChips: [], slotChips: [], extraChips: [], sections: [] });
  const eventsView = signal({ subtitle: 'What is on within 45 minutes of Port Credit.', windowChips: [], categoryChips: [], sections: [] });

  beforeEach(async () => {
    dialog = { open: vi.fn(() => ({ closed: of(undefined) })) };
    submissions = { loadMine: vi.fn(async () => undefined) };
    await TestBed.configureTestingModule({
      imports: [IdeasPage],
      providers: [
        provideRouter([
          {
            path: 'ideas',
            children: [
              { path: '', pathMatch: 'full', children: [] },
              { path: 'food', children: [] },
              { path: 'events', children: [] },
            ],
          },
        ]),
        { provide: Dialog, useValue: dialog },
        { provide: ACTIVITY_SERVICE, useValue: { list: () => activitiesView } },
        { provide: RESTAURANT_SERVICE, useValue: { list: () => foodView } },
        { provide: EVENTS_SERVICE, useValue: { list: () => eventsView } },
        { provide: EVENT_SUBMISSIONS_SERVICE, useValue: submissions },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(IdeasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  async function go(url: string): Promise<void> {
    await router.navigateByUrl(url);
    fixture.detectChanges();
  }

  const header = (): Element => host.querySelector('sd-page-header')!;
  const suggestButton = (): Element | null => host.querySelector('sd-button[slot="primary"]');

  it('renders the Ideas header with the three segments and an outlet', () => {
    expect(header().getAttribute('title')).toBe('Ideas');
    const tabs = Array.from(host.querySelectorAll('sd-segments a'));
    expect(tabs.map((t) => t.textContent?.trim())).toEqual(['Activities', 'Food', 'Events']);
    expect(tabs.map((t) => t.getAttribute('href'))).toEqual(['/ideas', '/ideas/food', '/ideas/events']);
    expect(host.querySelector('sd-segments')?.getAttribute('aria-label')).toBe('Idea type');
    expect(host.querySelector('router-outlet')).not.toBeNull();
  });

  it('starts on Activities with the live subtitle and no Suggest button', async () => {
    await go('/ideas');
    expect(component['tab']()).toBe('activities');
    expect(header().getAttribute('subtitle')).toBe('Picked for Eli and Mae, under 45 minutes from Port Credit.');
    expect(suggestButton()).toBeNull();
  });

  it('falls back to the mock subtitle when the segment has not loaded yet', async () => {
    await go('/ideas/food');
    expect(component['tab']()).toBe('food');
    expect(header().getAttribute('subtitle')).toBe('Places to eat near what you are already doing.');
    expect(suggestButton()).toBeNull();

    foodView.set({ ...foodView(), subtitle: 'Near Terre Bleu and close to home.' });
    fixture.detectChanges();
    expect(header().getAttribute('subtitle')).toBe('Near Terre Bleu and close to home.');
  });

  it('shows "Suggest an event" only on the Events segment', async () => {
    await go('/ideas/events');
    expect(component['tab']()).toBe('events');
    expect(header().getAttribute('subtitle')).toBe('What is on within 45 minutes of Port Credit.');
    expect(suggestButton()?.textContent).toContain('Suggest an event');
    await go('/ideas');
    expect(suggestButton()).toBeNull();
  });

  it('runs D10 then D11 and reloads the family suggestions after a submission', async () => {
    dialog.open.mockReturnValueOnce({ closed: of(SUBMISSION) });
    await component['suggest']();
    expect(dialog.open).toHaveBeenNthCalledWith(
      1,
      SubmitEventDialog,
      expect.objectContaining({ panelClass: 'sd-dialog-panel', autoFocus: 'first-tabbable' }),
    );
    expect(dialog.open).toHaveBeenNthCalledWith(
      2,
      EventSubmittedDialog,
      expect.objectContaining({ data: { submission: SUBMISSION } }),
    );
    expect(submissions.loadMine).toHaveBeenCalledTimes(1);
  });

  it('does nothing more when the suggestion dialog is dismissed', async () => {
    await component['suggest']();
    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(submissions.loadMine).not.toHaveBeenCalled();
  });
});
