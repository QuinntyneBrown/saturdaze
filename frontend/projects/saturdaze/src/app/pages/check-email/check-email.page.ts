import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { SESSION_STORE } from 'api';
import { AuthCard, AuthShell, Button, Icon, TextInput } from 'components';

/**
 * Post-send confirmation — `pages/check-email.html`. Reached after
 * `/signup` (verify your inbox) and `/forgot-password` (reset link sent).
 *
 * The resend button re-calls the matching backend flow for the entered or
 * carried email: password reset for forgot-password, verification for signup.
 */
@Component({
  selector: 'app-check-email',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthShell, AuthCard, Button, Icon, TextInput],
  templateUrl: './check-email.page.html',
  styleUrl: './check-email.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckEmailPage {
  private readonly session = inject(SESSION_STORE);
  private readonly route = inject(ActivatedRoute);
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly resending = signal(false);
  protected readonly resentAt = signal<number | null>(null);
  protected readonly resendError = signal('');
  protected readonly emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
  private readonly enteredEmail = toSignal(this.emailControl.valueChanges, {
    initialValue: this.emailControl.value,
  });
  protected readonly flow = computed(() => {
    const raw = this.queryParams().get('flow');
    return raw === 'verify' ? 'verify' : 'reset';
  });
  protected readonly knownEmail = computed(() => {
    return this.queryParams().get('email') ?? this.session.user()?.email ?? '';
  });
  protected readonly email = computed(() => this.knownEmail() || this.enteredEmail());
  protected readonly hasEmail = computed(() => this.knownEmail().length > 0 || isEmail(this.enteredEmail()));
  protected readonly maskedEmail = computed(() => maskEmail(this.knownEmail()));

  protected async resend(): Promise<void> {
    if (this.resending() || !this.hasEmail()) return;
    this.resending.set(true);
    this.resendError.set('');
    try {
      const email = this.email();
      if (this.flow() === 'verify') {
        await this.session.resendVerification({ email });
      } else {
        await this.session.forgotPassword({ email });
      }
      this.resentAt.set(Date.now());
    } catch {
      this.resendError.set("Couldn't resend the email. Try again in a minute.");
    } finally {
      this.resending.set(false);
    }
  }
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  const first = name.charAt(0);
  return `${first}${'*'.repeat(Math.max(3, name.length - 1))}@${domain}`;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
