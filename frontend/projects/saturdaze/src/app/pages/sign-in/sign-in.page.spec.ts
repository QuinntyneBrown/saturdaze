import { vi } from 'vitest';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { GOOGLE_IDENTITY, SESSION_STORE } from 'api';

import { SignInPage } from './sign-in.page';

describe('SignInPage', () => {
  let fixture: ComponentFixture<SignInPage>;
  let component: SignInPage;
  let host: HTMLElement;
  let session: {
    rememberedEmail: ReturnType<typeof signal<string | null>>;
    clearError: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    loginWithGoogle: ReturnType<typeof vi.fn>;
  };
  let google: {
    enabled: boolean;
    renderButton: ReturnType<typeof vi.fn>;
    /** The callback the page handed to `renderButton`. */
    onCredential: ((credential: string) => void) | null;
  };
  let navigate: ReturnType<typeof vi.fn>;

  async function mount(query: Record<string, string> = {}): Promise<void> {
    const queryParamMap = convertToParamMap(query);
    await TestBed.configureTestingModule({
      imports: [SignInPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: SESSION_STORE, useValue: session },
        { provide: GOOGLE_IDENTITY, useValue: google },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
              queryParamMap,
              params: {},
              queryParams: query,
              data: {},
              fragment: null,
            },
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
    navigate = vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValue(true) as unknown as ReturnType<typeof vi.fn>;
    fixture = TestBed.createComponent(SignInPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    host = fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    session = {
      rememberedEmail: signal<string | null>(null),
      clearError: vi.fn(),
      login: vi.fn(async () => undefined),
      loginWithGoogle: vi.fn(async () => undefined),
    };
    google = {
      enabled: true,
      onCredential: null,
      renderButton: vi.fn(async (_host: HTMLElement, onCredential: (c: string) => void) => {
        google.onCredential = onCredential;
      }),
    };
  });

  const banner = (): string | null => host.querySelector('sd-banner')?.textContent?.trim() ?? null;

  it('renders the welcome card with email, password, remember-me and the two links', async () => {
    await mount();
    expect(session.clearError).toHaveBeenCalled();
    expect(host.querySelector('.auth-card__title')?.textContent?.trim()).toBe('Welcome back');
    const fields = Array.from(host.querySelectorAll('sd-text-input'));
    expect(fields.map((f) => f.querySelector('.field__label')?.textContent?.trim())).toEqual([
      'Email',
      'Password',
    ]);
    expect(fields.map((f) => f.querySelector('input')?.getAttribute('type'))).toEqual([
      'email',
      'password',
    ]);
    expect(host.querySelector('sd-toggle .toggle__label')?.textContent?.trim()).toBe('Remember me');
    expect(host.querySelector('a[href="/reset-password"]')?.textContent?.trim()).toBe(
      'Forgot password?',
    );
    expect(host.querySelector('a[href="/create-account"]')?.textContent?.trim()).toBe(
      'Create an account',
    );
    expect(banner()).toBeNull();
    expect(component['form'].getRawValue()).toEqual({ email: '', password: '', remember: true });
  });

  it('prefills a remembered email', async () => {
    session.rememberedEmail.set('quinntynebrown@gmail.com');
    await mount();
    expect(component['form'].controls.email.value).toBe('quinntynebrown@gmail.com');
    expect(
      (host.querySelector('sd-text-input input[type="email"]') as HTMLInputElement).value,
    ).toBe('quinntynebrown@gmail.com');
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
    component['form'].setValue({
      email: 'quinn@example.com',
      password: 'password123',
      remember: false,
    });
    await component['submit']();
    expect(session.login).toHaveBeenCalledWith(
      { email: 'quinn@example.com', password: 'password123' },
      false,
    );
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
    expect(host.querySelectorAll('sd-text-input input[aria-invalid="true"]').length).toBe(2);
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

  // Traces to: L2-164 AC1, AC7
  describe('Continue with Google', () => {
    const divider = (): Element | null => host.querySelector('[role="separator"]');
    const googleHost = (): HTMLElement | null => host.querySelector('.google-btn');

    it('renders the divider and hands Google the host between Sign in and New here', async () => {
      await mount();
      expect(divider()?.textContent?.trim()).toBe('or');
      expect(divider()?.getAttribute('aria-label')).toBe('or');
      expect(googleHost()).not.toBeNull();
      expect(google.renderButton).toHaveBeenCalledWith(googleHost(), expect.any(Function));
      const order = Array.from(
        host.querySelectorAll('form, [role="separator"], .google-btn, .auth-card__alt'),
      );
      expect(
        order.map(
          (n) => n.tagName.toLowerCase() + (n.className ? '.' + n.className.split(' ')[0] : ''),
        ),
      ).toEqual(['form.form', 'div.auth-card__or', 'div.google-btn', 'p.auth-card__alt']);
    });

    it('shows neither the divider nor the host without a client id', async () => {
      google.enabled = false;
      await mount();
      expect(divider()).toBeNull();
      expect(googleHost()).toBeNull();
      expect(google.renderButton).not.toHaveBeenCalled();
    });

    it('hides both when the script fails to load', async () => {
      google.renderButton = vi.fn(async () => {
        throw new Error('blocked');
      });
      await mount();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(divider()).toBeNull();
      expect(googleHost()).toBeNull();
    });

    it('signs in with the credential and the remember choice, then lands on the return URL', async () => {
      await mount({ returnUrl: '/past' });
      component['form'].controls.remember.setValue(false);
      google.onCredential!('id-token');
      await fixture.whenStable();
      expect(session.loginWithGoogle).toHaveBeenCalledWith('id-token', false);
      expect(navigate).toHaveBeenCalledWith('/past');
      expect(component['submitting']()).toBe(false);
    });

    it('shows the verify-first banner for email_unverified without marking the fields', async () => {
      await mount();
      session.loginWithGoogle.mockRejectedValueOnce({ code: 'email_unverified', message: '' });
      google.onCredential!('id-token');
      await fixture.whenStable();
      fixture.detectChanges();
      expect(banner()).toBe(
        "That email already has a Saturdaze account that hasn't verified its email. Sign in with your password to verify it first.",
      );
      expect(host.querySelectorAll('sd-text-input input[aria-invalid="true"]').length).toBe(0);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('asks to try again when Google or the API refuses the credential', async () => {
      await mount();
      session.loginWithGoogle.mockRejectedValueOnce({ code: 'google_token_invalid', message: '' });
      google.onCredential!('id-token');
      await fixture.whenStable();
      expect(component['errorMessage']()).toBe("Google sign-in didn't complete. Try again.");
      session.loginWithGoogle.mockRejectedValueOnce({ code: 'google_not_configured', message: '' });
      google.onCredential!('id-token');
      await fixture.whenStable();
      expect(component['errorMessage']()).toBe("Sign in with Google isn't available right now.");
    });

    it('a Google failure clears when the password form is submitted next', async () => {
      await mount();
      session.loginWithGoogle.mockRejectedValueOnce({ code: 'google_token_invalid', message: '' });
      google.onCredential!('id-token');
      await fixture.whenStable();
      component['form'].setValue({ email: 'quinn@example.com', password: 'pw', remember: true });
      await component['submit']();
      expect(component['errorMessage']()).toBe('');
      expect(navigate).toHaveBeenCalledWith('/weekend');
    });
  });

  it('renders the error state for the design harness (?state=error)', async () => {
    await mount({ state: 'error' });
    expect(banner()).toBe('That email and password did not match.');
  });
});
