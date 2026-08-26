import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EVENT_SUBMISSIONS_SERVICE } from 'api';
import { EVENTS_SERVICE } from 'api';
import { Dialog } from '@angular/cdk/dialog';
import { EventsPage } from './events.page';

describe('EventsPage', () => {
  let component: EventsPage;
  let fixture: ComponentFixture<EventsPage>;
  let mockDialog: any;
  let mockEVENT_SUBMISSIONS_SERVICE: any;

  beforeEach(async () => {
    mockDialog = {
      open: vi.fn(),
    };

    mockEVENT_SUBMISSIONS_SERVICE = {
      mine: vi.fn(),
      loadMine: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EventsPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: EVENT_SUBMISSIONS_SERVICE, useValue: mockEVENT_SUBMISSIONS_SERVICE },
        { provide: EVENTS_SERVICE, useValue: {} },
        { provide: Dialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventsPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should render with mocked dependencies', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should call openQuickAdd without throwing', () => {
    expect(() => component['openQuickAdd']()).not.toThrow();
  });
});
