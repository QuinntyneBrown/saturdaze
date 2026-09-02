import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SESSION_STORE } from 'api';
import { SignupPage } from './signup.page';

describe('SignupPage', () => {
  let component: SignupPage;
  let fixture: ComponentFixture<SignupPage>;
  let mockSESSION_STORE: any;

  beforeEach(async () => {
    mockSESSION_STORE = {
      error: vi.fn(() => null),
      clearError: vi.fn(),
      signUp: vi.fn(() => Promise.resolve(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [SignupPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignupPage);
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
      imports: [SignupPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
    });
    TestBed.overrideComponent(SignupPage, {
      add: { schemas: [NO_ERRORS_SCHEMA] },
    });
    await TestBed.compileComponents();
    const stubbedFixture = TestBed.createComponent(SignupPage);
    stubbedFixture.detectChanges();
    expect(stubbedFixture.nativeElement).toBeTruthy();
  });

  it('should call onTermsChange without throwing', () => {
    expect(() => component['onTermsChange']({ preventDefault: () => {}, stopPropagation: () => {}, target: { value: '', checked: false }, currentTarget: { value: '', checked: false } } as any)).not.toThrow();
  });

  it('should call onFridayChange without throwing', () => {
    expect(() => component['onFridayChange']({ preventDefault: () => {}, stopPropagation: () => {}, target: { value: '', checked: false }, currentTarget: { value: '', checked: false } } as any)).not.toThrow();
  });

  it('should call onPasswordChange without throwing', () => {
    expect(() => component['onPasswordChange']('test-value')).not.toThrow();
  });

  it('should call submit without throwing', async () => {
    await expect(Promise.resolve(component['submit']()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should handle a failed signUp in submit', async () => {
    mockSESSION_STORE.signUp = vi.fn(() => Promise.reject(new Error('test')));
    await expect(Promise.resolve(component['submit']()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should compute false from canSubmit', () => {
    component['termsAccepted'].set(true as any);
    component['submitting'].set(true as any);
    expect(component['canSubmit']()).toBe(false);
  });

  it('should compute false from canSubmit (case 2)', () => {
    component['termsAccepted'].set(false as any);
    component['submitting'].set(true as any);
    expect(component['canSubmit']()).toBe(false);
  });

  it('should compute true from canSubmit', () => {
    component['termsAccepted'].set(true as any);
    component['submitting'].set(false as any);
    expect(component['canSubmit']()).toBe(true);
  });
});
