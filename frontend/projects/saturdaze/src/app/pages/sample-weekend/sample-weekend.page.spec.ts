import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { API_BASE_URL } from 'api';
import { SampleWeekendPage } from './sample-weekend.page';

describe('SampleWeekendPage', () => {
  let component: SampleWeekendPage;
  let fixture: ComponentFixture<SampleWeekendPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SampleWeekendPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({}), params: {}, queryParams: {}, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({})),
          params: of({}), queryParams: of({}), data: of({}),
        } },
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SampleWeekendPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should recompute isShared under seeded state', () => {
    component['shared'].set('x' as any);
    expect(() => component['isShared']()).not.toThrow();
  });

  it('should recompute heroSubtitle under seeded state', () => {
    component['shared'].set('x' as any);
    expect(() => component['heroSubtitle']()).not.toThrow();
  });

  it('should recompute forecastSubtitle under seeded state', () => {
    component['shared'].set({ weekendOf: 'x' } as any);
    expect(() => component['forecastSubtitle']()).not.toThrow();
  });

  describe('with route params', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [SampleWeekendPage],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([{ path: '**', children: [] }]),
          { provide: ActivatedRoute, useValue: {
            snapshot: { paramMap: convertToParamMap({ share: 'test-id' }), queryParamMap: convertToParamMap({}), params: { share: 'test-id' }, queryParams: {}, data: {} },
            paramMap: of(convertToParamMap({ share: 'test-id' })), queryParamMap: of(convertToParamMap({})),
            params: of({ share: 'test-id' }), queryParams: of({}), data: of({}),
          } },
          { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(SampleWeekendPage);
      component = fixture.componentInstance;
    });

    it('should create with a populated route', () => {
      expect(component).toBeTruthy();
    });
  });
});
