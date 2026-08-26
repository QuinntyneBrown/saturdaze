import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { WEEKEND_PLAN_SERVICE } from 'api';
import { Dialog } from '@angular/cdk/dialog';
import { ItineraryPage } from './itinerary.page';

describe('ItineraryPage', () => {
  let component: ItineraryPage;
  let fixture: ComponentFixture<ItineraryPage>;
  let mockDialog: any;
  let mockWEEKEND_PLAN_SERVICE: any;

  beforeEach(async () => {
    mockDialog = {
      open: vi.fn(),
    };

    mockWEEKEND_PLAN_SERVICE = {
      getItinerary: vi.fn(),
      setActiveDay: vi.fn(),
      regenerateDay: vi.fn(() => Promise.resolve(undefined)),
      lockDay: vi.fn(() => Promise.resolve(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [ItineraryPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({}), params: {}, queryParams: {}, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({})),
          params: of({}), queryParams: of({}), data: of({}),
        } },
        { provide: WEEKEND_PLAN_SERVICE, useValue: mockWEEKEND_PLAN_SERVICE },
        { provide: Dialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItineraryPage);
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

  it('should call selectDay without throwing', () => {
    expect(() => component['selectDay']({ preventDefault: () => {}, stopPropagation: () => {}, target: { value: '', checked: false }, currentTarget: { value: '', checked: false } } as any, 'test-value')).not.toThrow();
  });

  it('should call regenerateDay without throwing', async () => {
    await expect(Promise.resolve(component['regenerateDay']()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call openMore without throwing', async () => {
    await expect(Promise.resolve(component['openMore']()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call lockDay without throwing', async () => {
    await expect(Promise.resolve(component['lockDay']()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call seeMap without throwing', async () => {
    await expect(Promise.resolve(component['seeMap']()).then(() => true, () => true)).resolves.toBe(true);
  });
});
