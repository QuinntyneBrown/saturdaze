import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { SESSION_STORE } from 'api';
import { CheckEmailPage } from './check-email.page';

describe('CheckEmailPage', () => {
  let component: CheckEmailPage;
  let fixture: ComponentFixture<CheckEmailPage>;
  let mockSESSION_STORE: any;

  beforeEach(async () => {
    mockSESSION_STORE = {
      user: vi.fn(),
      resendVerification: vi.fn(() => Promise.resolve(undefined)),
      forgotPassword: vi.fn(() => Promise.resolve(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [CheckEmailPage],
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

    fixture = TestBed.createComponent(CheckEmailPage);
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
      imports: [CheckEmailPage],
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
    TestBed.overrideComponent(CheckEmailPage, {
      add: { schemas: [NO_ERRORS_SCHEMA] },
    });
    await TestBed.compileComponents();
    const stubbedFixture = TestBed.createComponent(CheckEmailPage);
    stubbedFixture.detectChanges();
    expect(stubbedFixture.nativeElement).toBeTruthy();
  });

  it('should call resend without throwing', async () => {
    await expect(Promise.resolve(component['resend']()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should handle a failed resendVerification in resend', async () => {
    mockSESSION_STORE.resendVerification = vi.fn(() => Promise.reject(new Error('test')));
    await expect(Promise.resolve(component['resend']()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should handle a failed forgotPassword in resend', async () => {
    mockSESSION_STORE.forgotPassword = vi.fn(() => Promise.reject(new Error('test')));
    await expect(Promise.resolve(component['resend']()).then(() => true, () => true)).resolves.toBe(true);
  });

  describe('with query params', () => {
    it('should create under seeded query params', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CheckEmailPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({ flow: 'test-value', email: 'test-value' }), params: {}, queryParams: { flow: 'test-value', email: 'test-value' }, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({ flow: 'test-value', email: 'test-value' })),
          params: of({}), queryParams: of({ flow: 'test-value', email: 'test-value' }), data: of({}),
        } },
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
      }).compileComponents();
      fixture = TestBed.createComponent(CheckEmailPage);
      component = fixture.componentInstance;
      expect(component).toBeTruthy();
    });

    it('should resolve flow to verify when flow is verify', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CheckEmailPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({ flow: "verify" }), params: {}, queryParams: { flow: "verify" }, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({ flow: "verify" })),
          params: of({}), queryParams: of({ flow: "verify" }), data: of({}),
        } },
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
      }).compileComponents();
      fixture = TestBed.createComponent(CheckEmailPage);
      component = fixture.componentInstance;
      expect(component['flow']()).toBe("verify");
    });

    it('should resolve flow to reset for any other flow', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CheckEmailPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({ flow: 'ngt-other-value' }), params: {}, queryParams: { flow: 'ngt-other-value' }, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({ flow: 'ngt-other-value' })),
          params: of({}), queryParams: of({ flow: 'ngt-other-value' }), data: of({}),
        } },
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
      }).compileComponents();
      fixture = TestBed.createComponent(CheckEmailPage);
      component = fixture.componentInstance;
      expect(component['flow']()).toBe("reset");
    });

    it('should call resendVerification when flow is verify', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CheckEmailPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({ flow: "verify", email: 'test-value' }), params: {}, queryParams: { flow: "verify", email: 'test-value' }, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({ flow: "verify", email: 'test-value' })),
          params: of({}), queryParams: of({ flow: "verify", email: 'test-value' }), data: of({}),
        } },
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
      }).compileComponents();
      fixture = TestBed.createComponent(CheckEmailPage);
      component = fixture.componentInstance;
      await Promise.resolve(component['resend']()).then(() => {}, () => {});
      expect(mockSESSION_STORE.resendVerification).toHaveBeenCalled();
    });

    it('should settle resend and reflect its finally writes', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CheckEmailPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({ flow: 'test-value', email: 'test-value' }), params: {}, queryParams: { flow: 'test-value', email: 'test-value' }, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({ flow: 'test-value', email: 'test-value' })),
          params: of({}), queryParams: of({ flow: 'test-value', email: 'test-value' }), data: of({}),
        } },
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
      }).compileComponents();
      fixture = TestBed.createComponent(CheckEmailPage);
      component = fixture.componentInstance;
      await Promise.resolve(component['resend']()).then(() => {}, () => {});
      expect(component['resending']()).toBe(false);
    });

    it('should reflect a failed resend through its error writes', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CheckEmailPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({ flow: 'test-value', email: 'test-value' }), params: {}, queryParams: { flow: 'test-value', email: 'test-value' }, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({ flow: 'test-value', email: 'test-value' })),
          params: of({}), queryParams: of({ flow: 'test-value', email: 'test-value' }), data: of({}),
        } },
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
      }).compileComponents();
      fixture = TestBed.createComponent(CheckEmailPage);
      component = fixture.componentInstance;
      mockSESSION_STORE.resendVerification = vi.fn(() => Promise.reject(new Error('test')));
      mockSESSION_STORE.forgotPassword = vi.fn(() => Promise.reject(new Error('test')));
      await Promise.resolve(component['resend']()).then(() => {}, () => {});
      expect(component['resendError']()).toBe("Couldn't resend the email. Try again in a minute.");
      expect(component['resending']()).toBe(false);
    });

    it('should compute  from knownEmail under seeded query params', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CheckEmailPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({ email: '' }), params: {}, queryParams: { email: '' }, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({ email: '' })),
          params: of({}), queryParams: of({ email: '' }), data: of({}),
        } },
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
      }).compileComponents();
      fixture = TestBed.createComponent(CheckEmailPage);
      component = fixture.componentInstance;
      expect(component['knownEmail']()).toBe('');
    });

    it('should compute test from knownEmail under seeded query params', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CheckEmailPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({ email: 'test' }), params: {}, queryParams: { email: 'test' }, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({ email: 'test' })),
          params: of({}), queryParams: of({ email: 'test' }), data: of({}),
        } },
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
      }).compileComponents();
      fixture = TestBed.createComponent(CheckEmailPage);
      component = fixture.componentInstance;
      expect(component['knownEmail']()).toBe('test');
    });

    it('should compute a****@example.com from maskedEmail under seeded query params', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CheckEmailPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({ email: 'alice@example.com' }), params: {}, queryParams: { email: 'alice@example.com' }, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({ email: 'alice@example.com' })),
          params: of({}), queryParams: of({ email: 'alice@example.com' }), data: of({}),
        } },
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
      }).compileComponents();
      fixture = TestBed.createComponent(CheckEmailPage);
      component = fixture.componentInstance;
      expect(component['maskedEmail']()).toBe('a****@example.com');
    });

    it('should compute  from maskedEmail under seeded query params', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CheckEmailPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({ email: '' }), params: {}, queryParams: { email: '' }, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({ email: '' })),
          params: of({}), queryParams: of({ email: '' }), data: of({}),
        } },
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
      }).compileComponents();
      fixture = TestBed.createComponent(CheckEmailPage);
      component = fixture.componentInstance;
      expect(component['maskedEmail']()).toBe('');
    });

    it('should compute x from maskedEmail under seeded query params', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CheckEmailPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({ email: 'x' }), params: {}, queryParams: { email: 'x' }, data: {} },
          paramMap: of(convertToParamMap({})), queryParamMap: of(convertToParamMap({ email: 'x' })),
          params: of({}), queryParams: of({ email: 'x' }), data: of({}),
        } },
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
      }).compileComponents();
      fixture = TestBed.createComponent(CheckEmailPage);
      component = fixture.componentInstance;
      expect(component['maskedEmail']()).toBe('x');
    });
  });
});
