import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthError, GOOGLE_IDENTITY, SESSION_STORE } from 'api';
import { AuthCard, AuthShell, Banner, Button, TextInput, Toggle } from 'components';

import { devState } from '../../shared/dev-state';
import { trimmedEmail } from '../../shared/trimmed-email.validator';

import { environment } from '../../../environments/environment';

/**
 * Sign in — `docs/mocks-v2/pages/sign-in.html`.
 *
 * Email + password + remember me. A wrong pair shows one warn banner above
 * the fields and marks both invalid. `?returnUrl=` (same-origin path only)
 * is honoured after a successful sign-in.
 *
 * Below the form, an "or" divider and Google's own button (Google Identity
 * Services, rendered into `.google-btn`) offer "Continue with Google"
 * (L2-158). The credential goes through `SessionStore.loginWithGoogle()`
 * with the same remember choice and return URL; a refused credential shows
 * the banner without marking the password fields.
 */
@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthShell,
    AuthCard,
    Banner,
    Button,
    TextInput,
    Toggle,
  ],
  templateUrl: './sign-in.page.html',
  styleUrl: './sign-in.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInPage {
  /** Where the brand and "Back to Saturdaze" lead: the marketing site (ADR-018). */
  protected readonly siteUrl = environment.siteUrl;
  private readonly session = inject(SESSION_STORE);
  private readonly google = inject(GOOGLE_IDENTITY);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly googleHost = viewChild<ElementRef<HTMLElement>>('googleHost');

  protected readonly submitting = signal(false);
  /** A failed password sign-in: shown in the banner and marks both fields. */
  private readonly localError = signal<AuthError | null>(null);
  /** A failed Google sign-in: shown in the banner only. */
  private readonly googleError = signal<AuthError | null>(null);
  /** False once Google's script could not load; hides the divider and the empty slot. */
  private readonly googleAvailable = signal(this.google.enabled);
  protected readonly showGoogle = computed(() => this.googleAvailable());

  protected readonly form = new FormGroup({
    email: new FormControl(this.session.rememberedEmail() ?? '', {
      nonNullable: true,
      validators: [Validators.required, trimmedEmail],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    remember: new FormControl(true, { nonNullable: true }),
  });

  protected readonly fieldsInvalid = computed(() => this.localError() !== null);

  protected readonly errorMessage = computed(() => {
    const error = this.localError() ?? this.googleError();
    if (!error) return '';
    switch (error.code) {
      case 'invalid_credentials':
        return 'That email and password did not match.';
      case 'rate_limited':
        return 'Too many tries. Wait a minute and try again.';
      case 'google_token_invalid':
      case 'google_email_unverified':
        return "Google sign-in didn't complete. Try again.";
      case 'google_not_configured':
        return "Sign in with Google isn't available right now.";
      case 'email_unverified':
        return "That email already has a Saturdaze account that hasn't verified its email. Sign in with your password to verify it first.";
      default:
        return error.message || 'Could not sign you in. Try again in a moment.';
    }
  });

  constructor() {
    this.session.clearError();
    if (devState(this.route) === 'error') {
      this.localError.set({ code: 'invalid_credentials', message: '' });
    }
    afterNextRender(() => {
      const host = this.googleHost()?.nativeElement;
      if (!host) return;
      this.google
        .renderButton(host, (credential) => void this.signInWithGoogle(credential))
        .catch(() => this.googleAvailable.set(false));
    });
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.googleError.set(null);
    const { email, password, remember } = this.form.getRawValue();
    await this.completeSignIn(
      () => this.session.login({ email: email.trim(), password }, remember),
      (error) => {
        this.localError.set(error);
        if (error.code === 'invalid_credentials') {
          this.form.controls.password.reset();
        }
      },
    );
  }

  /** Google handed back a credential (L2-158): the remember toggle still decides persistence. */
  private async signInWithGoogle(credential: string): Promise<void> {
    if (this.submitting()) return;
    this.localError.set(null);
    await this.completeSignIn(
      () => this.session.loginWithGoogle(credential, this.form.controls.remember.value),
      (error) => this.googleError.set(error),
    );
  }

  /** One path for both sign-ins: run it, land on the return URL, or hand the error to `onError`. */
  private async completeSignIn(
    signIn: () => Promise<void>,
    onError: (error: AuthError) => void,
  ): Promise<void> {
    this.submitting.set(true);
    this.localError.set(null);
    this.googleError.set(null);
    try {
      await signIn();
      await this.router.navigateByUrl(this.returnUrl());
    } catch (e) {
      onError(e as AuthError);
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
