import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { SESSION_STORE } from 'api';
import { VerifyEmailPage } from './verify-email.page';

describe('VerifyEmailPage', () => {
  let component: VerifyEmailPage;
  let fixture: ComponentFixture<VerifyEmailPage>;
  let mockSESSION_STORE: any;

  beforeEach(async () => {
    mockSESSION_STORE = {
      verifyEmail: vi.fn(() => Promise.resolve(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [VerifyEmailPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({}), params: {}, queryParams: {}, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({})),
          params: of({}), queryParams: of({}), data: of({}),
        } },
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyEmailPage);
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
      imports: [VerifyEmailPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({}), params: {}, queryParams: {}, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({})),
          params: of({}), queryParams: of({}), data: of({}),
        } },
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
    });
    TestBed.overrideComponent(VerifyEmailPage, {
      add: { schemas: [NO_ERRORS_SCHEMA] },
    });
    await TestBed.compileComponents();
    const stubbedFixture = TestBed.createComponent(VerifyEmailPage);
    stubbedFixture.detectChanges();
    expect(stubbedFixture.nativeElement).toBeTruthy();
  });

  describe('with query params', () => {
    it('should create under seeded query params', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [VerifyEmailPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({ token: 'test-value' }), params: {}, queryParams: { token: 'test-value' }, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({ token: 'test-value' })),
          params: of({}), queryParams: of({ token: 'test-value' }), data: of({}),
        } },
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
      }).compileComponents();
      fixture = TestBed.createComponent(VerifyEmailPage);
      component = fixture.componentInstance;
      expect(component).toBeTruthy();
    });

    it('should compute  from token under seeded query params', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [VerifyEmailPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({ token: '' }), params: {}, queryParams: { token: '' }, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({ token: '' })),
          params: of({}), queryParams: of({ token: '' }), data: of({}),
        } },
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
      }).compileComponents();
      fixture = TestBed.createComponent(VerifyEmailPage);
      component = fixture.componentInstance;
      expect(component['token']()).toBe('');
    });

    it('should compute  from token under seeded query params (case 2)', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [VerifyEmailPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({}), params: {}, queryParams: {}, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({})),
          params: of({}), queryParams: of({}), data: of({}),
        } },
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
      }).compileComponents();
      fixture = TestBed.createComponent(VerifyEmailPage);
      component = fixture.componentInstance;
      expect(component['token']()).toBe('');
    });

    it('should compute test from token under seeded query params', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [VerifyEmailPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({ token: 'test' }), params: {}, queryParams: { token: 'test' }, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({ token: 'test' })),
          params: of({}), queryParams: of({ token: 'test' }), data: of({}),
        } },
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
      }).compileComponents();
      fixture = TestBed.createComponent(VerifyEmailPage);
      component = fixture.componentInstance;
      expect(component['token']()).toBe('test');
    });
  });
});
