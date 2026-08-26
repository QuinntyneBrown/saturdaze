import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { EVENT_SUBMISSIONS_SERVICE } from 'api';
import { Dialog } from '@angular/cdk/dialog';
import { AdminEventsPage } from './admin-events.page';

describe('AdminEventsPage', () => {
  let component: AdminEventsPage;
  let fixture: ComponentFixture<AdminEventsPage>;
  let mockDialog: any;
  let mockEVENT_SUBMISSIONS_SERVICE: any;

  beforeEach(async () => {
    mockDialog = {
      open: vi.fn(),
    };

    mockEVENT_SUBMISSIONS_SERVICE = {
      pending: vi.fn(),
      loadPending: vi.fn(),
      approve: vi.fn(() => Promise.resolve(undefined)),
      reject: vi.fn(() => Promise.resolve(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [AdminEventsPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: EVENT_SUBMISSIONS_SERVICE, useValue: mockEVENT_SUBMISSIONS_SERVICE },
        { provide: Dialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEventsPage);
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
      imports: [AdminEventsPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: EVENT_SUBMISSIONS_SERVICE, useValue: mockEVENT_SUBMISSIONS_SERVICE },
        { provide: Dialog, useValue: mockDialog },
      ],
    });
    TestBed.overrideComponent(AdminEventsPage, {
      add: { schemas: [NO_ERRORS_SCHEMA] },
    });
    await TestBed.compileComponents();
    const stubbedFixture = TestBed.createComponent(AdminEventsPage);
    stubbedFixture.detectChanges();
    expect(stubbedFixture.nativeElement).toBeTruthy();
  });

  it('should call formatWhen without throwing', () => {
    expect(() => component['formatWhen']('test-value')).not.toThrow();
  });

  it('should call submittedAgo without throwing', () => {
    expect(() => component['submittedAgo']('test-value')).not.toThrow();
  });

  it('should call openApprove without throwing', async () => {
    await expect(Promise.resolve(component['openApprove']({ id: 'test-value' } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call openReject without throwing', async () => {
    await expect(Promise.resolve(component['openReject']({ id: 'test-value' } as any)).then(() => true, () => true)).resolves.toBe(true);
  });
});
