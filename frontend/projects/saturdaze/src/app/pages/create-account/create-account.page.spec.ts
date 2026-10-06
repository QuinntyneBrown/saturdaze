import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { SESSION_STORE } from 'api';

import { CreateAccountPage } from './create-account.page';

describe('CreateAccountPage', () => {
  let fixture: ComponentFixture<CreateAccountPage>;
  let component: CreateAccountPage;
  let host: HTMLElement;
  let session: { clearError: ReturnType<typeof vi.fn>; signUp: ReturnType<typeof vi.fn> };
  let navigate: ReturnType<typeof vi.spyOn>;

  // Validators.email rejects surrounding whitespace, so only the family name
  // carries padding to prove the trim.
  const VALID = {
    familyName: ' The Browns ',
    email: 'quinn@example.com',
    password: 'Lavender2026!',
    terms: true,
    fridayPreview: true,
  };

  beforeEach(async () => {
    session = { clearError: vi.fn(), signUp: vi.fn(async () => undefined) };
    await TestBed.configureTestingModule({
      imports: [CreateAccountPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: SESSION_STORE, useValue: session },
      ],
    }).compileComponents();
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(CreateAccountPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  const submitButton = (): HTMLButtonElement =>
    host.querySelector('button[type="submit"]') as HTMLButtonElement;
  const fieldError = (index: number): string | null =>
    host
      .querySelectorAll('sd-text-input')
      [index]?.querySelector('.field__error')
      ?.textContent?.trim() ?? null;
  const strengthLevel = (): string | null => {
    const meter = host.querySelector('sd-strength');
    if (!meter) return null;
    return ['weak', 'ok', 'strong'].find((l) => meter.classList.contains(`strength--${l}`)) ?? null;
  };

  it('renders the sign-up card with the fields from the mock', () => {
    expect(session.clearError).toHaveBeenCalled();
    expect(host.querySelector('.auth-card__title')?.textContent?.trim()).toBe(
      'Start planning weekends',
    );
    const fields = Array.from(host.querySelectorAll('sd-text-input'));
    expect(fields.map((f) => f.querySelector('.field__label')?.textContent?.trim())).toEqual([
      'Family name',
      'Email',
      'Password',
    ]);
    expect(fields[2]?.querySelector('.field__hint')?.textContent?.trim()).toBe(
      'Eight characters or more.',
    );
    const boxes = Array.from(host.querySelectorAll('sd-checkbox'));
    expect(boxes.length).toBe(2);
    expect(boxes[0]?.querySelector('input')?.getAttribute('aria-required')).toBe('true');
    expect(boxes[1]?.querySelector('input')?.getAttribute('aria-required')).toBeNull();
    expect(boxes[0]?.querySelector('a[href="/legal"]')?.textContent?.trim()).toBe('Terms');
    expect(boxes[0]?.querySelector('a[href="/legal#privacy"]')?.textContent?.trim()).toBe(
      'Privacy Policy',
    );
    expect(host.querySelector('a[href="/sign-in"]')?.textContent?.trim()).toBe('Sign in');
    expect(component['form'].controls.fridayPreview.value).toBe(true);
    expect(submitButton().disabled).toBe(true);
  });

  it('shows the strength meter as the password grows', () => {
    expect(host.querySelector('sd-strength')).toBeNull();
    component['form'].controls.password.setValue('short');
    fixture.detectChanges();
    expect(strengthLevel()).toBe('weak');
    component['form'].controls.password.setValue('Lavender2026!');
    fixture.detectChanges();
    expect(strengthLevel()).toBe('strong');
  });

  it('enables the button only when the form is valid, including the terms gate', () => {
    component['form'].setValue({ ...VALID, terms: false });
    fixture.detectChanges();
    expect(component['canSubmit']()).toBe(false);
    expect(submitButton().disabled).toBe(true);
    component['form'].controls.terms.setValue(true);
    fixture.detectChanges();
    expect(component['canSubmit']()).toBe(true);
    expect(submitButton().disabled).toBe(false);
  });

  it('refuses to submit while invalid', async () => {
    await component['submit']();
    expect(session.signUp).not.toHaveBeenCalled();
    expect(component['form'].controls.email.touched).toBe(true);
  });

  it('creates the account with trimmed values and moves to verify-email', async () => {
    component['form'].setValue(VALID);
    await component['submit']();
    expect(session.signUp).toHaveBeenCalledWith({
      familyName: 'The Browns',
      email: 'quinn@example.com',
      password: 'Lavender2026!',
      fridayPreview: true,
      homeLocation: null,
    });
    expect(navigate).toHaveBeenCalledWith(['/verify-email'], {
      queryParams: { email: 'quinn@example.com' },
    });
    expect(component['submitting']()).toBe(false);
  });

  it('puts an email-in-use error on the email field', async () => {
    session.signUp.mockRejectedValueOnce({ code: 'email_in_use', message: '' });
    component['form'].setValue(VALID);
    await component['submit']();
    fixture.detectChanges();
    expect(fieldError(1)).toBe('That email already has an account. Sign in instead.');
    expect(fieldError(2)).toBeNull();
    expect(host.querySelector('sd-banner')).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('puts a weak-password error on the password field and everything else in a banner', async () => {
    component['form'].setValue(VALID);
    session.signUp.mockRejectedValueOnce({ code: 'weak_password', message: '' });
    await component['submit']();
    fixture.detectChanges();
    expect(fieldError(2)).toBe('Choose a stronger password.');
    expect(fieldError(1)).toBeNull();

    session.signUp.mockRejectedValueOnce({ code: 'rate_limited', message: 'Slow down.' });
    await component['submit']();
    fixture.detectChanges();
    expect(host.querySelector('sd-banner')?.textContent?.trim()).toBe('Slow down.');

    session.signUp.mockRejectedValueOnce({ code: 'rate_limited', message: '' });
    await component['submit']();
    expect(component['bannerError']()).toBe('Could not create the account. Try again in a moment.');
  });
});
