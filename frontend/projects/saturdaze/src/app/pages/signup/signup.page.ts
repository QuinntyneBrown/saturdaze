import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SESSION_STORE } from 'api';
import { AuthCard, AuthShell, Button, Icon, TextInput } from 'components';

/**
 * Sign-up page — mirrors `docs/mocks/pages/signup.html`.
 *
 * Slice D2 wires the form to `SessionStore.signUp()`; on success the user
 * lands at `/check-email`. D3 adds client-side validation; D4 surfaces the
 * backend `email_in_use` error inline.
 */

interface SignupFormValue {
  familyName: string;
  homeLocation: string;
  email: string;
  password: string;
  terms: boolean;
  fridayPreview: boolean;
}

function strongEnoughPassword(c: AbstractControl): ValidationErrors | null {
  const v = c.value as string | null;
  if (!v) return null;
  if (v.length < 8) return { weak: true };
  return null;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthShell,
    AuthCard,
    Button,
    Icon,
    TextInput,
  ],
  templateUrl: './signup.page.html',
  styleUrl: './signup.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupPage {
  private readonly session = inject(SESSION_STORE);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly error = this.session.error;

  protected readonly form = new FormGroup({
    familyName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    homeLocation: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, strongEnoughPassword],
    }),
    terms: new FormControl<boolean>(false, { nonNullable: true }),
    fridayPreview: new FormControl<boolean>(true, { nonNullable: true }),
  });

  protected readonly termsAccepted = signal(false);
  protected readonly fridayPreviewOn = signal(true);
  protected readonly passwordWeak = signal(false);

  protected readonly canSubmit = computed(
    () => this.termsAccepted() && !this.submitting(),
  );

  protected onTermsChange(event: Event): void {
    const v = (event.target as HTMLInputElement).checked;
    this.form.controls.terms.setValue(v);
    this.termsAccepted.set(v);
  }

  protected onFridayChange(event: Event): void {
    const v = (event.target as HTMLInputElement).checked;
    this.form.controls.fridayPreview.setValue(v);
    this.fridayPreviewOn.set(v);
  }

  protected onPasswordChange(value: string): void {
    this.passwordWeak.set(value.length > 0 && value.length < 8);
  }

  protected async submit(): Promise<void> {
    if (!this.canSubmit() || this.form.invalid) return;
    this.submitting.set(true);
    const v = this.form.getRawValue() as SignupFormValue;
    try {
      await this.session.signUp({
        familyName: v.familyName,
        homeLocation: v.homeLocation,
        email: v.email,
        password: v.password,
        fridayPreview: v.fridayPreview,
      });
      await this.router.navigate(['/check-email'], {
        queryParams: { flow: 'verify', email: v.email },
      });
    } catch {
      // Error surfaced via session.error signal.
    } finally {
      this.submitting.set(false);
    }
  }
}
