import { vi } from 'vitest';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { SESSION_STORE } from 'api';

import { VerifyEmailPage } from './verify-email.page';

/** Flush every pending microtask (the app is zoneless, so whenStable cannot see mocked promises). */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('VerifyEmailPage', () => {
  let fixture: ComponentFixture<VerifyEmailPage>;
  let component: VerifyEmailPage;
  let host: HTMLElement;
  let session: {
    user: ReturnType<typeof signal<any>>;
    verifyEmail: ReturnType<typeof vi.fn>;
    resendVerification: ReturnType<typeof vi.fn>;
  };

  async function mount(query: Record<string, string> = {}): Promise<void> {
    const queryParamMap = convertToParamMap(query);
    await TestBed.configureTestingModule({
      imports: [VerifyEmailPage],
      providers: [
        provideRouter([]),
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
    fixture = TestBed.createComponent(VerifyEmailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    session = {
      user: signal(null),
      verifyEmail: vi.fn(async () => undefined),
      resendVerification: vi.fn(async () => undefined),
    };
  });

  const title = (): string | null => host.querySelector('sd-auth-card')?.getAttribute('title') ?? null;

  it('shows "check your email" with the masked address right after sign-up (no token)', async () => {
    await mount({ email: 'quinntynebrown@gmail.com' });
    expect(session.verifyEmail).not.toHaveBeenCalled();
    expect(title()).toBe('Check your email');
    expect(host.querySelector('.auth-card__sub')?.textContent?.trim()).toBe(
      'We sent a verification link to q••••••••••••n@gmail.com. It works for 24 hours.',
    );
    expect(host.querySelector('sd-button[variant="ghost"] a')?.getAttribute('href')).toBe('/weekend');
  });

  it('falls back to the signed-in user, then to "your inbox"', async () => {
    session.user.set({ id: 'u1', email: 'sara@example.com', role: 'User', emailVerifiedUtc: null });
    await mount();
    expect(component['maskedEmail']()).toBe('s•••a@example.com');

    TestBed.resetTestingModule();
    session.user.set(null);
    await mount();
    expect(component['maskedEmail']()).toBe('your inbox');
  });

  it('consumes the token: verifying, then verified', async () => {
    let resolve!: () => void;
    session.verifyEmail.mockReturnValueOnce(new Promise<void>((r) => (resolve = r)));
    await mount({ token: 'tok' });
    expect(session.verifyEmail).toHaveBeenCalledWith({ token: 'tok' });
    expect(title()).toBe('Verifying your email');
    expect(host.querySelector('[role="status"]')?.textContent?.trim()).toBe('Verifying your email');

    resolve();
    await settle();
    fixture.detectChanges();
    expect(title()).toBe('You are verified');
    expect(host.querySelector('sd-button[variant="primary"] a')?.getAttribute('href')).toBe('/family');
  });

  it('treats an already-verified email as verified', async () => {
    session.verifyEmail.mockRejectedValueOnce({ code: 'email_already_verified', message: '' });
    await mount({ token: 'tok' });
    await settle();
    fixture.detectChanges();
    expect(title()).toBe('You are verified');
    expect(component['error']()).toBeNull();
  });

  it('shows the expired card for a dead token and can resend when the email is known', async () => {
    session.verifyEmail.mockRejectedValueOnce({ code: 'token_expired', message: 'Expired.' });
    await mount({ token: 'old', email: 'quinn@example.com' });
    await settle();
    fixture.detectChanges();
    expect(title()).toBe('This link has expired');
    expect(component['error']()).toEqual({ code: 'token_expired', message: 'Expired.' });
    const resend = host.querySelector('sd-button[variant="primary"]') as HTMLElement;
    expect(resend.hasAttribute('disabled')).toBe(false);
    expect(resend.textContent).toContain('Resend verification email');

    (resend.querySelector('button') as HTMLButtonElement).click();
    await settle();
    fixture.detectChanges();
    expect(session.resendVerification).toHaveBeenCalledWith({ email: 'quinn@example.com' });
    expect(component['resent']()).toBe(true);
    expect(resend.textContent).toContain('Sent');
    expect(resend.hasAttribute('disabled')).toBe(true);
  });

  it('cannot resend without an address', async () => {
    await mount({ state: 'expired' });
    expect(host.querySelector('sd-button[variant="primary"]')?.hasAttribute('disabled')).toBe(true);
    await component['resend']();
    expect(session.resendVerification).not.toHaveBeenCalled();
  });

  it('renders each of the four states for the design harness', async () => {
    const titles: Record<string, string> = {
      sent: 'Check your email',
      verifying: 'Verifying your email',
      verified: 'You are verified',
      expired: 'This link has expired',
    };
    for (const [state, expected] of Object.entries(titles)) {
      TestBed.resetTestingModule();
      await mount({ state, token: 'ignored' });
      expect(title(), state).toBe(expected);
    }
    expect(session.verifyEmail).not.toHaveBeenCalled();
  });
});
