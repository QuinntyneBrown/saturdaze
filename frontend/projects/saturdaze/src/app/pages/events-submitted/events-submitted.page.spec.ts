import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EVENT_SUBMISSIONS_SERVICE } from 'api';
import { EventsSubmittedPage } from './events-submitted.page';

describe('EventsSubmittedPage', () => {
  let component: EventsSubmittedPage;
  let fixture: ComponentFixture<EventsSubmittedPage>;
  let mockEVENT_SUBMISSIONS_SERVICE: any;

  beforeEach(async () => {
    mockEVENT_SUBMISSIONS_SERVICE = {
      mine: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EventsSubmittedPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: EVENT_SUBMISSIONS_SERVICE, useValue: mockEVENT_SUBMISSIONS_SERVICE },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventsSubmittedPage);
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
});
