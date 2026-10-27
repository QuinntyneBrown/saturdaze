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
  PasswordRules,
  Strength,
  TextInput,
} from 'components';

import {
  meetsPasswordRules,
  passwordRules,
  passwordStrength,
} from '../../shared/password-strength';
import { memberAge } from '../../shared/member-age.validator';
import { trimmedEmail } from '../../shared/trimmed-email.validator';

import { environment } from '../../../environments/environment';

/**
 * Create account — `docs/mocks-v2/pages/create-account.html`.
 *
 * Family name, the owner's first name and age (they become the first one
 * in "Who's in", L2-215), email, password (with the strength meter), terms consent
 * (client-side gate; the API has no consent field) and the Friday preview
 * opt-in. Success lands on the onboarding wizard, `/welcome/home` (L2-165);
 * the verification email is on its way and the wizard's last step says so.
 * Home location is not asked here; it is the wizard's first step.
 */
@Component({
  selector: 'app-create-account',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthShell,
    AuthCard,
    Banner,
    Button,
    Checkbox,
    PasswordRules,
    Strength,
    TextInput,
  ],
  templateUrl: './create-account.page.html',
  styleUrl: './create-account.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAccountPage {
  /** Where the brand and "Back to Saturdaze" lead: the marketing site (ADR-018). */
  protected readonly siteUrl = environment.siteUrl;
  private readonly session = inject(SESSION_STORE);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  private readonly error = signal<AuthError | null>(null);

  protected readonly form = new FormGroup({
    familyName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    ownerName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)],
    }),
    ownerAge: new FormControl<string | number>('', {
      nonNullable: true,
      validators: [Validators.required, memberAge],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, trimmedEmail],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, meetsPasswordRules],
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
  protected readonly rules = computed(() => passwordRules(this.password()));
  protected readonly canSubmit = computed(
    () => this.formStatus() === 'VALID' && !this.submitting(),
  );

  private readonly ownerAge = toSignal(this.form.controls.ownerAge.events, { initialValue: null });
  /** Shown once the age was left with a value outside 0 to 120 (L2-215 AC6). */
  protected readonly ageError = computed(() => {
    this.ownerAge();
    const control = this.form.controls.ownerAge;
    return control.touched && control.hasError('memberAge')
      ? 'Enter an age between 0 and 120.'
      : '';
  });

  protected readonly emailError = computed(() =>
    this.error()?.code === 'email_in_use'
      ? 'That email already has an account. Sign in instead.'
      : '',
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
    const { familyName, ownerName, ownerAge, email, password, fridayPreview } =
      this.form.getRawValue();
    try {
      await this.session.signUp({
        familyName: familyName.trim(),
        email: email.trim(),
        password,
        fridayPreview,
        homeLocation: null,
        ownerName: ownerName.trim(),
        ownerAge: Number(ownerAge),
      });
      await this.router.navigate(['/welcome', 'home']);
    } catch (e) {
      this.error.set(e as AuthError);
    } finally {
      this.submitting.set(false);
    }
  }
}
