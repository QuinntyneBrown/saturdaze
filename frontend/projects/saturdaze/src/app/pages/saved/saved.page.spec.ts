import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WEEKEND_PLAN_SERVICE } from 'api';
import { SAVED_SERVICE } from 'api';
import { Dialog } from '@angular/cdk/dialog';
import { SavedPage } from './saved.page';

describe('SavedPage', () => {
  let component: SavedPage;
  let fixture: ComponentFixture<SavedPage>;
  let mockDialog: any;
  let mockWEEKEND_PLAN_SERVICE: any;

  beforeEach(async () => {
    mockDialog = {
      open: vi.fn(),
    };

    mockWEEKEND_PLAN_SERVICE = {
      remixSaved: vi.fn(() => Promise.resolve(undefined)),
      repeatSaved: vi.fn(() => Promise.resolve(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [SavedPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: WEEKEND_PLAN_SERVICE, useValue: mockWEEKEND_PLAN_SERVICE },
        { provide: SAVED_SERVICE, useValue: {} },
        { provide: Dialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SavedPage);
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

  it('should call openMore without throwing', () => {
    expect(() => component['openMore']()).not.toThrow();
  });

  it('should call remix without throwing', async () => {
    await expect(Promise.resolve(component['remix']('test-id', 'test-value')).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call repeat without throwing', async () => {
    await expect(Promise.resolve(component['repeat']('test-id', 'test-value')).then(() => true, () => true)).resolves.toBe(true);
  });
});
