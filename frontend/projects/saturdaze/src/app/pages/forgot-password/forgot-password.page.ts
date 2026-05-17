import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SESSION_STORE } from 'api';
import { AuthCard, AuthShell, Button, Icon, TextInput } from 'components';

/**
 * Forgot password — `pages/forgot-password.html`.
 *
 * Submission always navigates to `/check-email`, regardless of whether the
 * email is on file. Per the security contract we never leak account
 * existence (see `docs/auth-implementation-plan.md` D12).
 */
@Component({
  selector: 'app-forgot-password',
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
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPage {
  private readonly session = inject(SESSION_STORE);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    try {
      await this.session.forgotPassword({ email: this.form.controls.email.value });
    } catch {
      // Per spec the store never throws here; defensive `catch` just in
      // case the underlying service surfaces a network error.
    } finally {
      this.submitting.set(false);
      await this.router.navigateByUrl('/check-email');
    }
  }
}
