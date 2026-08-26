import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ACTIVITY_SERVICE } from 'api';
import { Dialog } from '@angular/cdk/dialog';
import { ActivitiesPage } from './activities.page';

describe('ActivitiesPage', () => {
  let component: ActivitiesPage;
  let fixture: ComponentFixture<ActivitiesPage>;
  let mockDialog: any;

  beforeEach(async () => {
    mockDialog = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ActivitiesPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ACTIVITY_SERVICE, useValue: {} },
        { provide: Dialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivitiesPage);
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
      imports: [ActivitiesPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ACTIVITY_SERVICE, useValue: {} },
        { provide: Dialog, useValue: mockDialog },
      ],
    });
    TestBed.overrideComponent(ActivitiesPage, {
      add: { schemas: [NO_ERRORS_SCHEMA] },
    });
    await TestBed.compileComponents();
    const stubbedFixture = TestBed.createComponent(ActivitiesPage);
    stubbedFixture.detectChanges();
    expect(stubbedFixture.nativeElement).toBeTruthy();
  });

  it('should call trySomethingNew without throwing', () => {
    expect(() => component['trySomethingNew']()).not.toThrow();
  });
});
