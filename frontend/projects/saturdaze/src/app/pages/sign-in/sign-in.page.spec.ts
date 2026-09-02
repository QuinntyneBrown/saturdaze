import { vi } from 'vitest';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { SESSION_STORE } from 'api';

import { SignInPage } from './sign-in.page';

describe('SignInPage', () => {
  let fixture: ComponentFixture<SignInPage>;
  let component: SignInPage;
  let host: HTMLElement;
  let session: {
    rememberedEmail: ReturnType<typeof signal<string | null>>;
    clearError: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
  };
  let navigate: ReturnType<typeof vi.fn>;

  async function mount(query: Record<string, string> = {}): Promise<void> {
    const queryParamMap = convertToParamMap(query);
    await TestBed.configureTestingModule({
      imports: [SignInPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: SESSION_STORE, useValue: session },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({}), queryParamMap, params: {}, queryParams: query, data: {}, fragment: null },
            paramMap: of(convertToParamMap({})),
            queryParamMap: of(queryParamMap),
            params: of({}),
            queryParams: of(query),
            data: of({}),
            fragment: of(null),
          },
        },
      ],
    }).compileComponents();
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true) as unknown as ReturnType<typeof vi.fn>;
    fixture = TestBed.createComponent(SignInPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    session = {
      rememberedEmail: signal<string | null>(null),
      clearError: vi.fn(),
      login: vi.fn(async () => undefined),
    };
  });

  const banner = (): string | null => host.querySelector('sd-banner')?.textContent?.trim() ?? null;

  it('renders the welcome card with email, password, remember-me and the two links', async () => {
    await mount();
    expect(session.clearError).toHaveBeenCalled();
    expect(host.querySelector('sd-auth-card')?.getAttribute('title')).toBe('Welcome back');
    const fields = Array.from(host.querySelectorAll('sd-text-input'));
    expect(fields.map((f) => f.getAttribute('label'))).toEqual(['Email', 'Password']);
    expect(fields.map((f) => f.getAttribute('type'))).toEqual(['email', 'password']);
    expect(host.querySelector('sd-toggle')?.getAttribute('label')).toBe('Remember me');
    expect(host.querySelector('a[href="/reset-password"]')?.textContent?.trim()).toBe('Forgot password?');
    expect(host.querySelector('a[href="/create-account"]')?.textContent?.trim()).toBe('Create an account');
    expect(banner()).toBeNull();
    expect(component['form'].getRawValue()).toEqual({ email: '', password: '', remember: true });
  });

  it('prefills a remembered email', async () => {
    session.rememberedEmail.set('quinntynebrown@gmail.com');
    await mount();
    expect(component['form'].controls.email.value).toBe('quinntynebrown@gmail.com');
    expect((host.querySelector('sd-text-input input[type="email"]') as HTMLInputElement).value).toBe(
      'quinntynebrown@gmail.com',
    );
  });

  it('does not submit an invalid form', async () => {
    await mount();
    component['form'].setValue({ email: 'not-an-email', password: '', remember: true });
    await component['submit']();
    expect(session.login).not.toHaveBeenCalled();
    expect(component['form'].controls.password.touched).toBe(true);
  });

  it('signs in with the email and remember flag and lands on /weekend', async () => {
    await mount();
    component['form'].setValue({ email: 'quinn@example.com', password: 'password123', remember: false });
    await component['submit']();
    expect(session.login).toHaveBeenCalledWith({ email: 'quinn@example.com', password: 'password123' }, false);
    expect(navigate).toHaveBeenCalledWith('/weekend');
    expect(component['submitting']()).toBe(false);
  });

  it('honours a same-origin returnUrl and ignores anything else', async () => {
    await mount({ returnUrl: '/past' });
    component['form'].setValue({ email: 'quinn@example.com', password: 'pw', remember: true });
    await component['submit']();
    expect(navigate).toHaveBeenCalledWith('/past');

    TestBed.resetTestingModule();
    await mount({ returnUrl: '//evil.example' });
    component['form'].setValue({ email: 'quinn@example.com', password: 'pw', remember: true });
    await component['submit']();
    expect(navigate).toHaveBeenCalledWith('/weekend');
  });

  it('shows one warn banner and marks both fields invalid on a wrong pair', async () => {
    await mount();
    session.login.mockRejectedValueOnce({ code: 'invalid_credentials', message: '' });
    component['form'].setValue({ email: 'quinn@example.com', password: 'nope', remember: true });
    await component['submit']();
    fixture.detectChanges();
    expect(banner()).toBe('That email and password did not match.');
    expect(host.querySelectorAll('sd-text-input[invalid]').length).toBe(2);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('maps rate limiting and unknown errors to their messages', async () => {
    await mount();
    component['form'].setValue({ email: 'quinn@example.com', password: 'pw', remember: true });
    session.login.mockRejectedValueOnce({ code: 'rate_limited', message: '' });
    await component['submit']();
    expect(component['errorMessage']()).toBe('Too many tries. Wait a minute and try again.');
    session.login.mockRejectedValueOnce({ code: 'token_invalid', message: 'Server said no.' });
    await component['submit']();
    expect(component['errorMessage']()).toBe('Server said no.');
    session.login.mockRejectedValueOnce({ code: 'token_invalid', message: '' });
    await component['submit']();
    expect(component['errorMessage']()).toBe('Could not sign you in. Try again in a moment.');
  });

  it('renders the error state for the design harness (?state=error)', async () => {
    await mount({ state: 'error' });
    expect(banner()).toBe('That email and password did not match.');
  });
});
