import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import {
  AuthCard,
  AuthShell,
  Banner,
  Button,
  Disc,
  Icon,
  Strength,
  TextInput,
} from 'components';

import { devState } from '../../shared/dev-state';
import { maskEmail } from '../../shared/mask-email';
import { passwordStrength } from '../../shared/password-strength';
import { trimmedEmail } from '../../shared/trimmed-email.validator';

/**
 * Reset password — `docs/mocks-v2/pages/reset-password.html`, one page with
 * five states: request a link → check your email → choose a new password
 * (`?token=` present) → done, plus the expired-link state.
 */

type ResetState = 'request' | 'sent' | 'new' | 'done' | 'expired';

function matchPassword(c: AbstractControl): ValidationErrors | null {
  const password = c.get('password')?.value as string | undefined;
  const confirm = c.get('confirm')?.value as string | undefined;
  if (!password || !confirm) return null;
  return password === confirm ? null : { mismatch: true };
}

const STATES: readonly ResetState[] = ['request', 'sent', 'new', 'done', 'expired'];

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthShell, AuthCard, Banner, Button, Disc, Icon, Strength, TextInput],
  templateUrl: './reset-password.page.html',
  styleUrl: './reset-password.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPage {
  private readonly session = inject(SESSION_STORE);
  private readonly route = inject(ActivatedRoute);

  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  protected readonly state = signal<ResetState>(this.initialState());
  protected readonly email = signal(this.route.snapshot.queryParamMap.get('email') ?? '');
  protected readonly maskedEmail = computed(() => maskEmail(this.email() || 'you@example.com'));
  protected readonly submitting = signal(false);
  protected readonly resent = signal(false);
  protected readonly error = signal('');

  protected readonly requestForm = new FormGroup({
    email: new FormControl(this.email(), {
      nonNullable: true,
      validators: [Validators.required, trimmedEmail],
    }),
  });

  protected readonly newForm = new FormGroup(
    {
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirm: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: matchPassword },
  );

  private readonly newPassword = toSignal(this.newForm.controls.password.valueChanges, {
    initialValue: '',
  });
  protected readonly strength = computed(() => passwordStrength(this.newPassword()));

  private initialState(): ResetState {
    const dev = devState(this.route);
    if (dev && (STATES as readonly string[]).includes(dev)) return dev as ResetState;
    return this.token ? 'new' : 'request';
  }

  protected async sendLink(): Promise<void> {
    if (this.requestForm.invalid || this.submitting()) {
      this.requestForm.markAllAsTouched();
      return;
    }
    const email = this.requestForm.controls.email.value.trim();
    this.submitting.set(true);
    this.error.set('');
    try {
      await this.session.forgotPassword({ email });
    } catch {
      // Never reveal whether the address exists: the "sent" card shows either way.
    } finally {
      this.email.set(email);
      this.submitting.set(false);
      this.state.set('sent');
    }
  }

  protected async resend(): Promise<void> {
    if (this.resent() || this.submitting()) return;
    this.submitting.set(true);
    try {
      await this.session.forgotPassword({ email: this.email() });
    } catch {
      // Same as above: no account-existence leak.
    } finally {
      this.submitting.set(false);
      this.resent.set(true);
      setTimeout(() => this.resent.set(false), 60_000);
    }
  }

  protected async savePassword(): Promise<void> {
    if (this.newForm.invalid || this.submitting()) {
      this.newForm.markAllAsTouched();
      this.error.set(this.newForm.hasError('mismatch') ? 'Those passwords do not match.' : '');
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    try {
      await this.session.resetPassword({
        token: this.token,
        password: this.newForm.controls.password.value,
      });
      this.state.set('done');
    } catch (e) {
      const error = e as AuthError;
      if (error.code === 'token_expired' || error.code === 'token_invalid') {
        this.state.set('expired');
      } else {
        this.error.set(error.message || 'Could not save that password. Try again in a moment.');
      }
    } finally {
      this.submitting.set(false);
    }
  }

  protected startOver(): void {
    this.error.set('');
    this.state.set('request');
  }
}
