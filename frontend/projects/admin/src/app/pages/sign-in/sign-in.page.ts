import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthError, SESSION_STORE } from 'api';
import { AuthCard, AuthShell, Banner, Button, TextInput, Toggle } from 'components';

/**
 * Admin sign in — `docs/mocks/pages/admin.sign-in.html` (A1). The family
 * app's auth card with the admin title; the same account signs in. A wrong
 * pair shows one warn banner and marks both fields invalid. `?returnUrl=`
 * (same-origin path only) is honoured after a successful sign-in
 * (L2-111 AC4); the role gate lives in the app shell.
 */
@Component({
  selector: 'sd-admin-sign-in',
  standalone: true,
  imports: [ReactiveFormsModule, AuthShell, AuthCard, Banner, Button, TextInput, Toggle],
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
      validators: [Validators.required, Validators.email],
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

  /** Only same-origin app paths; anything else falls back to the home screen. */
  private returnUrl(): string {
    const raw = this.route.snapshot.queryParamMap.get('returnUrl') ?? '';
    return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
  }
}
