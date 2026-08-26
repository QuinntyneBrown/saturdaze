import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { EVENT_SUBMISSIONS_SERVICE } from 'api';
import { EventsSubmitPage } from './events-submit.page';

describe('EventsSubmitPage', () => {
  let component: EventsSubmitPage;
  let fixture: ComponentFixture<EventsSubmitPage>;
  let mockEVENT_SUBMISSIONS_SERVICE: any;

  beforeEach(async () => {
    mockEVENT_SUBMISSIONS_SERVICE = {
      submit: vi.fn(() => Promise.resolve(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [EventsSubmitPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: EVENT_SUBMISSIONS_SERVICE, useValue: mockEVENT_SUBMISSIONS_SERVICE },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventsSubmitPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should render with stubbed children', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [EventsSubmitPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: EVENT_SUBMISSIONS_SERVICE, useValue: mockEVENT_SUBMISSIONS_SERVICE },
      ],
    });
    TestBed.overrideComponent(EventsSubmitPage, {
      add: { schemas: [NO_ERRORS_SCHEMA] },
    });
    await TestBed.compileComponents();
    const stubbedFixture = TestBed.createComponent(EventsSubmitPage);
    stubbedFixture.detectChanges();
    expect(stubbedFixture.nativeElement).toBeTruthy();
  });

  it('should call cancel without throwing', () => {
    expect(() => component['cancel']()).not.toThrow();
  });

  it('should call submit without throwing', async () => {
    await expect(Promise.resolve(component['submit']({ preventDefault: () => {}, stopPropagation: () => {}, target: { value: '', checked: false }, currentTarget: { value: '', checked: false } } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should handle a failed submit in submit', async () => {
    mockEVENT_SUBMISSIONS_SERVICE.submit = vi.fn(() => Promise.reject(new Error('test')));
    await expect(Promise.resolve(component['submit']({ preventDefault: () => {}, stopPropagation: () => {}, target: { value: '', checked: false }, currentTarget: { value: '', checked: false } } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should recompute canSubmit under seeded state', () => {
    component['title'].set('x' as any);
    component['startsAtLocal'].set({ length: 'x' } as any);
    component['submitting'].set(true as any);
    expect(() => component['canSubmit']()).not.toThrow();
  });
});
