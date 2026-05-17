import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthError, SESSION_STORE } from 'api';
import { AuthCard, AuthShell, Button, Icon, TextInput } from 'components';

/**
 * Reset-password page — `pages/reset-password.html`.
 *
 * Reads `?token=` from the URL. Valid → render the form, submit → /login
 * with a one-shot success banner. Missing or invalid token → render the
 * error state with a link back to /forgot-password.
 */

function matchPassword(c: AbstractControl): ValidationErrors | null {
  const password = c.get('password')?.value as string | undefined;
  const confirm = c.get('confirm')?.value as string | undefined;
  if (!password || !confirm) return null;
  return password === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.page.html',
  styleUrl: './reset-password.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPage {
  private readonly session = inject(SESSION_STORE);
  private readonly route = inject(ActivatedRoute);

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly token = computed(() => this.queryParams().get('token') ?? '');
  protected readonly tokenMissing = computed(() => this.token().length === 0);
  protected readonly submitting = signal(false);
  protected readonly tokenError = signal<AuthError | null>(null);
  protected readonly success = signal(false);

  protected readonly form = new FormGroup(
    {
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirm: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: matchPassword },
  );

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    this.tokenError.set(null);
    try {
      await this.session.resetPassword({
        token: this.token(),
        password: this.form.controls.password.value,
      });
      this.success.set(true);
    } catch (e) {
      this.tokenError.set(e as AuthError);
    } finally {
      this.submitting.set(false);
    }
  }
}
