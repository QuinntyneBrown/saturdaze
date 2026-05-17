import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SESSION_STORE } from 'api';
import { AuthCard, AuthShell, Button, Icon, TextInput, Toggle } from 'components';

/**
 * Sign-in page — mirrors `docs/mocks/pages/login.html`.
 *
 * The form submits via `SessionStore.login()`; `remember` chooses whether
 * the token persists in `localStorage` (default) or `sessionStorage`.
 *
 * Successful sign-in lands on `/weekend` (or the `returnUrl` query param,
 * once slice G2 adds route guards that set it).
 */

interface LoginFormValue {
  email: string;
  password: string;
  remember: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthShell,
    AuthCard,
    Button,
    Icon,
    TextInput,
    Toggle,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly session = inject(SESSION_STORE);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly error = this.session.error;

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    remember: new FormControl<boolean>(true, { nonNullable: true }),
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    const { email, password, remember } = this.form.getRawValue() as LoginFormValue;
    try {
      await this.session.login({ email, password }, remember);
      await this.router.navigateByUrl('/weekend');
    } catch {
      // SessionStore surfaces the error via its `error` signal; the template
      // renders it. The promise rejection is expected.
    } finally {
      this.submitting.set(false);
    }
  }
}
