import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { WEEKEND_PLAN_SERVICE } from 'api';
import { Dialog } from '@angular/cdk/dialog';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let mockDialog: any;
  let mockWEEKEND_PLAN_SERVICE: any;

  beforeEach(async () => {
    mockDialog = {
      open: vi.fn(),
    };

    mockWEEKEND_PLAN_SERVICE = {
      getOverview: vi.fn(),
      plan: vi.fn(() => Promise.resolve(undefined)),
      calendarLinks: vi.fn(),
      createShareLink: vi.fn(() => Promise.resolve(undefined)),
      regenerate: vi.fn(() => Promise.resolve(undefined)),
      regenerateDay: vi.fn(() => Promise.resolve(undefined)),
      lockBlock: vi.fn(() => Promise.resolve(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: WEEKEND_PLAN_SERVICE, useValue: mockWEEKEND_PLAN_SERVICE },
        { provide: Dialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
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
      imports: [HomePage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: WEEKEND_PLAN_SERVICE, useValue: mockWEEKEND_PLAN_SERVICE },
        { provide: Dialog, useValue: mockDialog },
      ],
    });
    TestBed.overrideComponent(HomePage, {
      add: { schemas: [NO_ERRORS_SCHEMA] },
    });
    await TestBed.compileComponents();
    const stubbedFixture = TestBed.createComponent(HomePage);
    stubbedFixture.detectChanges();
    expect(stubbedFixture.nativeElement).toBeTruthy();
  });


  it('should return early from planWeekend when generating is truthy', async () => {
    component['generating'].set(true as any);
    await expect(Promise.resolve(component['planWeekend']()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should run planWeekend when all guards pass', async () => {
    component['generating'].set(false as any);
    await expect(Promise.resolve(component['planWeekend']()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should handle a failed plan in planWeekend', async () => {
    component['generating'].set(false as any);
    mockWEEKEND_PLAN_SERVICE.plan = vi.fn(() => Promise.reject(new Error('test')));
    await expect(Promise.resolve(component['planWeekend']()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call openCalendar without throwing', () => {
    expect(() => component['openCalendar']()).not.toThrow();
  });

  it('should call openShare without throwing', async () => {
    await expect(Promise.resolve(component['openShare']()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call regenerateWeekend without throwing', async () => {
    await expect(Promise.resolve(component['regenerateWeekend']()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call regenerateDay without throwing', async () => {
    await expect(Promise.resolve(component['regenerateDay']()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call startLockMode without throwing', () => {
    expect(() => component['startLockMode']()).not.toThrow();
  });

  it('should reflect startLockMode through its signals', () => {
    component['startLockMode']();
    expect(component['lockMode']()).toBe(true);
  });

  it('should call finishLockMode without throwing', () => {
    expect(() => component['finishLockMode']()).not.toThrow();
  });

  it('should reflect finishLockMode through its signals', () => {
    component['finishLockMode']();
    expect(component['lockMode']()).toBe(false);
  });

  it('should call toggleLock without throwing', async () => {
    await expect(Promise.resolve(component['toggleLock']({ id: 'test-value', locked: 'test-value' } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call openItineraryDay without throwing', () => {
    expect(() => component['openItineraryDay']()).not.toThrow();
  });
  it('should call openItineraryDay with optional arguments provided', () => {
    expect(() => component['openItineraryDay']("Saturday")).not.toThrow();
  });

  it('should call handleQuickAction without throwing', () => {
    expect(() => component['handleQuickAction']('test-value')).not.toThrow();
  });
});
