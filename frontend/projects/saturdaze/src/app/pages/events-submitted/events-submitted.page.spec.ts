import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { EVENT_SUBMISSIONS_SERVICE } from 'api';
import { EventsSubmittedPage } from './events-submitted.page';

describe('EventsSubmittedPage', () => {
  let fixture: ComponentFixture<EventsSubmittedPage>;
  let component: EventsSubmittedPage;
  let submissions: any;
  const mine = signal<any[]>([]);

  async function build() {
    submissions = { mine: () => mine, loadMine: vi.fn(() => Promise.resolve()) };
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EventsSubmittedPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: EVENT_SUBMISSIONS_SERVICE, useValue: submissions },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(EventsSubmittedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('fetches submissions on a direct visit when the cache is empty', async () => {
    mine.set([]);
    await build();
    expect(submissions.loadMine).toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain("I'll review your submission within a day.");
  });

  it('shows the newest submission without refetching when one is cached', async () => {
    mine.set([
      { id: 'a', title: 'Older', startsAtLocal: '2026-05-16T14:00', location: null, status: 'Pending', submittedAtUtc: '2026-05-01T00:00:00Z' },
      { id: 'b', title: 'Newest', startsAtLocal: '2026-05-23T10:00', location: 'Milton', status: 'Pending', submittedAtUtc: '2026-05-10T00:00:00Z' },
    ]);
    await build();
    expect(submissions.loadMine).not.toHaveBeenCalled();
    expect(component['latest']()!.title).toBe('Newest');
    expect(component['dateParts']()).toEqual({ day: '23', mon: 'MAY' });
    expect(component['whenLabel']()).toMatch(/Sat/);
  });
});
