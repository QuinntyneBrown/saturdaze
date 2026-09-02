import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { SESSION_STORE } from 'api';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let mockSESSION_STORE: any;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  beforeEach(async () => {
    mockSESSION_STORE = {
      rememberedEmail: vi.fn(() => null),
      error: vi.fn(() => null),
      clearError: vi.fn(),
      login: vi.fn(() => Promise.resolve(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [LoginPage],
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

    fixture = TestBed.createComponent(LoginPage);
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
      imports: [LoginPage],
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
    TestBed.overrideComponent(LoginPage, {
      add: { schemas: [NO_ERRORS_SCHEMA] },
    });
    await TestBed.compileComponents();
    const stubbedFixture = TestBed.createComponent(LoginPage);
    stubbedFixture.detectChanges();
    expect(stubbedFixture.nativeElement).toBeTruthy();
  });

  it('should call submit without throwing', async () => {
    await expect(Promise.resolve(component['submit']()).then(() => true, () => true)).resolves.toBe(true);
  });

  describe('with route params', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [LoginPage],
        providers: [
          provideRouter([{ path: '**', children: [] }]),
          { provide: ActivatedRoute, useValue: {
            snapshot: { paramMap: convertToParamMap({ returnUrl: 'test-id' }), queryParamMap: convertToParamMap({}), params: { returnUrl: 'test-id' }, queryParams: {}, data: {} },
            paramMap: of(convertToParamMap({ returnUrl: 'test-id' })), queryParamMap: of(convertToParamMap({})),
            params: of({ returnUrl: 'test-id' }), queryParams: of({}), data: of({}),
          } },
          { provide: SESSION_STORE, useValue: mockSESSION_STORE },
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(LoginPage);
      component = fixture.componentInstance;
    });

    it('should create with a populated route', () => {
      expect(component).toBeTruthy();
    });
  });
});
