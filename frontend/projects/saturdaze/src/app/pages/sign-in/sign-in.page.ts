import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthError, SESSION_STORE } from 'api';
import { AuthCard, AuthShell, Banner, Button, TextInput, Toggle } from 'components';

import { devState } from '../../shared/dev-state';
import { trimmedEmail } from '../../shared/trimmed-email.validator';

/**
 * Sign in — `docs/mocks-v2/pages/sign-in.html`.
 *
 * Email + password + remember me. A wrong pair shows one warn banner above
 * the fields and marks both invalid. `?returnUrl=` (same-origin path only)
 * is honoured after a successful sign-in.
 */
@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthShell, AuthCard, Banner, Button, TextInput, Toggle],
  templateUrl: './sign-in.page.html',
  styleUrl: './sign-in.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInPage {
  private readonly session = inject(SESSION_STORE);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly submitting = signal(false);
  private readonly localError = signal<AuthError | null>(null);

  protected readonly form = new FormGroup({
    email: new FormControl(this.session.rememberedEmail() ?? '', {
      nonNullable: true,
      validators: [Validators.required, trimmedEmail],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    remember: new FormControl(true, { nonNullable: true }),
  });

  protected readonly errorMessage = computed(() => {
    const error = this.localError();
    if (!error) return '';
    switch (error.code) {
      case 'invalid_credentials':
        return 'That email and password did not match.';
      case 'rate_limited':
        return 'Too many tries. Wait a minute and try again.';
      default:
        return error.message || 'Could not sign you in. Try again in a moment.';
    }
  });

  constructor() {
    this.session.clearError();
    if (devState(this.route) === 'error') {
      this.localError.set({ code: 'invalid_credentials', message: '' });
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.localError.set(null);
    const { email, password, remember } = this.form.getRawValue();
    try {
      await this.session.login({ email: email.trim(), password }, remember);
      await this.router.navigateByUrl(this.returnUrl());
    } catch (e) {
      const error = e as AuthError;
      this.localError.set(error);
      if (error.code === 'invalid_credentials') {
        this.form.controls.password.reset();
      }
    } finally {
      this.submitting.set(false);
    }
  }

  /** Only same-origin app paths; anything else falls back to /weekend. */
  private returnUrl(): string {
    const raw = this.route.snapshot.queryParamMap.get('returnUrl') ?? '';
    return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/weekend';
  }
}
