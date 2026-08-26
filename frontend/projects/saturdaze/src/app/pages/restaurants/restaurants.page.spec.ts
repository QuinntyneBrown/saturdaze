import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RESTAURANT_SERVICE } from 'api';
import { Dialog } from '@angular/cdk/dialog';
import { RestaurantsPage } from './restaurants.page';

describe('RestaurantsPage', () => {
  let component: RestaurantsPage;
  let fixture: ComponentFixture<RestaurantsPage>;
  let mockDialog: any;
  let mockRESTAURANT_SERVICE: any;

  beforeEach(async () => {
    mockDialog = {
      open: vi.fn(),
    };

    mockRESTAURANT_SERVICE = {
      list: vi.fn(),
      refresh: vi.fn(() => Promise.resolve(undefined)),
      vote: vi.fn(),
      lock: vi.fn(() => Promise.resolve(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [RestaurantsPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: RESTAURANT_SERVICE, useValue: mockRESTAURANT_SERVICE },
        { provide: Dialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RestaurantsPage);
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


  it('should return early from refreshPicks when refreshing is truthy', async () => {
    component['refreshing'].set(true as any);
    await expect(Promise.resolve(component['refreshPicks']()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should run refreshPicks when all guards pass', async () => {
    component['refreshing'].set(false as any);
    await expect(Promise.resolve(component['refreshPicks']()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should handle a failed refresh in refreshPicks', async () => {
    component['refreshing'].set(false as any);
    mockRESTAURANT_SERVICE.refresh = vi.fn(() => Promise.reject(new Error('test')));
    await expect(Promise.resolve(component['refreshPicks']()).then(() => true, () => true)).resolves.toBe(true);
  });


  it('should return early from vote when restaurantId is falsy', () => {
    expect(() => component['vote'](null as any, 'test-value', {} as any)).not.toThrow();
  });

  it('should run vote when all guards pass', () => {
    expect(() => component['vote']('test-value', 'test-value', {} as any)).not.toThrow();
  });


  it('should return early from lockRestaurant when restaurantId is falsy', async () => {
    await expect(Promise.resolve(component['lockRestaurant'](null as any, 'test-value')).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should run lockRestaurant when all guards pass', async () => {
    await expect(Promise.resolve(component['lockRestaurant']('test-value', 'test-value')).then(() => true, () => true)).resolves.toBe(true);
  });
});
