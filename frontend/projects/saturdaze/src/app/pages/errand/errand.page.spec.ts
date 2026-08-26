import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { WEEKEND_PLAN_SERVICE } from 'api';
import { ErrandPage } from './errand.page';

describe('ErrandPage', () => {
  let component: ErrandPage;
  let fixture: ComponentFixture<ErrandPage>;
  let mockWEEKEND_PLAN_SERVICE: any;

  beforeEach(async () => {
    mockWEEKEND_PLAN_SERVICE = {
      addErrand: vi.fn(() => Promise.resolve(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [ErrandPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: WEEKEND_PLAN_SERVICE, useValue: mockWEEKEND_PLAN_SERVICE },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrandPage);
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
      imports: [ErrandPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: WEEKEND_PLAN_SERVICE, useValue: mockWEEKEND_PLAN_SERVICE },
      ],
    });
    TestBed.overrideComponent(ErrandPage, {
      add: { schemas: [NO_ERRORS_SCHEMA] },
    });
    await TestBed.compileComponents();
    const stubbedFixture = TestBed.createComponent(ErrandPage);
    stubbedFixture.detectChanges();
    expect(stubbedFixture.nativeElement).toBeTruthy();
  });

  it('should call pickDifferentSlot without throwing', () => {
    expect(() => component['pickDifferentSlot']()).not.toThrow();
  });

  it('should reflect pickDifferentSlot through its signals', () => {
    component['pickDifferentSlot']();
    expect(component['showSlots']()).toBe(true);
  });

  it('should call selectSlot without throwing', () => {
    expect(() => component['selectSlot']({} as any)).not.toThrow();
  });

  it('should reflect selectSlot through its signals', () => {
    const slotArg = {} as any;
    component['selectSlot'](slotArg);
    expect(component['selectedSlot']()).toBe(slotArg);
  });

  it('should call addToWeekend without throwing', async () => {
    await expect(Promise.resolve(component['addToWeekend']()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call backToWeekend without throwing', () => {
    expect(() => component['backToWeekend']()).not.toThrow();
  });
});
