import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthError, SESSION_STORE } from 'api';
import {
  AuthCard,
  AuthShell,
  Banner,
  Button,
  Checkbox,
  Strength,
  TextInput,
} from 'components';

import { passwordStrength } from '../../shared/password-strength';

/**
 * Create account — `docs/mocks-v2/pages/create-account.html`.
 *
 * Family name, email, password (with the strength meter), terms consent
 * (client-side gate; the API has no consent field) and the Friday preview
 * opt-in. Success lands on `/verify-email` in its "check your email" state.
 * Home location is not asked here; it lives on Family.
 */
@Component({
  selector: 'app-create-account',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthShell, AuthCard, Banner, Button, Checkbox, Strength, TextInput],
  templateUrl: './create-account.page.html',
  styleUrl: './create-account.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAccountPage {
  private readonly session = inject(SESSION_STORE);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  private readonly error = signal<AuthError | null>(null);

  protected readonly form = new FormGroup({
    familyName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    terms: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
    fridayPreview: new FormControl(true, { nonNullable: true }),
  });

  private readonly password = toSignal(this.form.controls.password.valueChanges, {
    initialValue: '',
  });
  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  protected readonly strength = computed(() => passwordStrength(this.password()));
  protected readonly canSubmit = computed(() => this.formStatus() === 'VALID' && !this.submitting());

  protected readonly emailError = computed(() =>
    this.error()?.code === 'email_in_use' ? 'That email already has an account. Sign in instead.' : '',
  );
  protected readonly passwordError = computed(() =>
    this.error()?.code === 'weak_password' ? 'Choose a stronger password.' : '',
  );
  protected readonly bannerError = computed(() => {
    const e = this.error();
    if (!e || e.code === 'email_in_use' || e.code === 'weak_password') return '';
    return e.message || 'Could not create the account. Try again in a moment.';
  });

  constructor() {
    this.session.clearError();
  }

  protected async submit(): Promise<void> {
    if (!this.canSubmit()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    const { familyName, email, password, fridayPreview } = this.form.getRawValue();
    try {
      await this.session.signUp({
        familyName: familyName.trim(),
        email: email.trim(),
        password,
        fridayPreview,
        homeLocation: null,
      });
      await this.router.navigate(['/verify-email'], { queryParams: { email: email.trim() } });
    } catch (e) {
      this.error.set(e as AuthError);
    } finally {
      this.submitting.set(false);
    }
  }
}
