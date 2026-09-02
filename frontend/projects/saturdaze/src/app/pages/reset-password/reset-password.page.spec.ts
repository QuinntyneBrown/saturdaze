import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { SESSION_STORE } from 'api';

import { ResetPasswordPage } from './reset-password.page';

describe('ResetPasswordPage', () => {
  let fixture: ComponentFixture<ResetPasswordPage>;
  let component: ResetPasswordPage;
  let host: HTMLElement;
  let session: { forgotPassword: ReturnType<typeof vi.fn>; resetPassword: ReturnType<typeof vi.fn> };

  async function mount(query: Record<string, string> = {}): Promise<void> {
    const queryParamMap = convertToParamMap(query);
    await TestBed.configureTestingModule({
      imports: [ResetPasswordPage],
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
    fixture = TestBed.createComponent(ResetPasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    session = { forgotPassword: vi.fn(async () => undefined), resetPassword: vi.fn(async () => undefined) };
  });

  const title = (): string | null => host.querySelector('sd-auth-card')?.getAttribute('title') ?? null;

  it('starts by asking for the email, or for a new password when a token is present', async () => {
    await mount();
    expect(title()).toBe('Reset your password');
    expect(host.querySelector('a[href="/sign-in"]')?.textContent?.trim()).toBe('Back to sign in');

    TestBed.resetTestingModule();
    await mount({ token: 'abc' });
    expect(title()).toBe('Choose a new password');
  });

  it('renders each of the five states for the design harness', async () => {
    const titles: Record<string, string> = {
      request: 'Reset your password',
      sent: 'Check your email',
      new: 'Choose a new password',
      done: 'Password updated',
      expired: 'This link has expired',
    };
    for (const [state, expected] of Object.entries(titles)) {
      TestBed.resetTestingModule();
      await mount({ state });
      expect(title(), state).toBe(expected);
    }
    expect(host.querySelector('sd-disc[slot="disc"]')?.getAttribute('icon')).toBe('key');
  });

  it('prefills ?email= and masks it on the sent card', async () => {
    await mount({ email: 'quinntynebrown@gmail.com' });
    expect(component['requestForm'].controls.email.value).toBe('quinntynebrown@gmail.com');
    expect(component['maskedEmail']()).toBe('q••••••••••••n@gmail.com');
  });

  it('sends the link and shows the sent card whatever the API says', async () => {
    await mount();
    await component['sendLink']();
    expect(session.forgotPassword).not.toHaveBeenCalled();

    component['requestForm'].setValue({ email: 'quinn@example.com' });
    await component['sendLink']();
    fixture.detectChanges();
    expect(session.forgotPassword).toHaveBeenCalledWith({ email: 'quinn@example.com' });
    expect(component['state']()).toBe('sent');
    expect(host.querySelector('.email-chip')?.textContent?.trim()).toBe('q•••n@example.com');

    TestBed.resetTestingModule();
    await mount();
    session.forgotPassword.mockRejectedValueOnce(new Error('404'));
    component['requestForm'].setValue({ email: 'nobody@example.com' });
    await component['sendLink']();
    expect(component['state']()).toBe('sent');
  });

  it('resends once and then rests for a minute', async () => {
    vi.useFakeTimers();
    try {
      await mount({ state: 'sent', email: 'quinn@example.com' });
      await component['resend']();
      fixture.detectChanges();
      expect(session.forgotPassword).toHaveBeenCalledWith({ email: 'quinn@example.com' });
      expect(component['resent']()).toBe(true);
      expect(host.querySelector('sd-button[variant="quiet"]')?.textContent).toContain('Sent');
      expect(host.querySelector('sd-button[variant="quiet"]')?.hasAttribute('disabled')).toBe(true);

      await component['resend']();
      expect(session.forgotPassword).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(60_000);
      fixture.detectChanges();
      expect(component['resent']()).toBe(false);
      expect(host.querySelector('sd-button[variant="quiet"]')?.textContent).toContain('Resend');
    } finally {
      vi.useRealTimers();
    }
  });

  it('refuses mismatched passwords with an inline banner', async () => {
    await mount({ token: 'abc' });
    component['newForm'].setValue({ password: 'Lavender2026!', confirm: 'Lavender2025!' });
    await component['savePassword']();
    fixture.detectChanges();
    expect(session.resetPassword).not.toHaveBeenCalled();
    expect(host.querySelector('sd-banner')?.textContent?.trim()).toBe('Those passwords do not match.');
    expect(host.querySelectorAll('sd-text-input')[1]?.hasAttribute('invalid')).toBe(true);
  });

  it('saves the new password with the token and shows the done card', async () => {
    await mount({ token: 'abc' });
    component['newForm'].setValue({ password: 'Lavender2026!', confirm: 'Lavender2026!' });
    fixture.detectChanges();
    expect(host.querySelector('sd-strength')?.getAttribute('level')).toBe('strong');
    await component['savePassword']();
    fixture.detectChanges();
    expect(session.resetPassword).toHaveBeenCalledWith({ token: 'abc', password: 'Lavender2026!' });
    expect(title()).toBe('Password updated');
    expect(host.querySelector('sd-button a')?.getAttribute('href')).toBe('/sign-in');
  });

  it('moves to the expired card on a dead token, and can start over', async () => {
    await mount({ token: 'old' });
    session.resetPassword.mockRejectedValueOnce({ code: 'token_expired', message: '' });
    component['newForm'].setValue({ password: 'Lavender2026!', confirm: 'Lavender2026!' });
    await component['savePassword']();
    fixture.detectChanges();
    expect(title()).toBe('This link has expired');

    (host.querySelector('sd-button[variant="primary"] button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(title()).toBe('Reset your password');
  });

  it('keeps other failures inline on the new-password card', async () => {
    await mount({ token: 'abc' });
    session.resetPassword.mockRejectedValueOnce({ code: 'weak_password', message: 'Pick a stronger one.' });
    component['newForm'].setValue({ password: 'password1', confirm: 'password1' });
    await component['savePassword']();
    fixture.detectChanges();
    expect(component['state']()).toBe('new');
    expect(host.querySelector('sd-banner')?.textContent?.trim()).toBe('Pick a stronger one.');
  });
});
