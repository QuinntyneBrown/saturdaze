import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuthError, SESSION_STORE } from 'api';
import { AuthCard, AuthShell, Button, Disc, Icon, Spinner } from 'components';

import { devState } from '../../shared/dev-state';
import { maskEmail } from '../../shared/mask-email';

/**
 * Verify email — `docs/mocks-v2/pages/verify-email.html`, one page with
 * four states: "check your email" (right after creating an account, no
 * token), verifying (`?token=` being consumed), verified, and expired.
 * No guard: the link works signed in or out.
 */

type VerifyState = 'sent' | 'verifying' | 'verified' | 'expired';

const STATES: readonly VerifyState[] = ['sent', 'verifying', 'verified', 'expired'];

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [AuthShell, AuthCard, Button, Disc, Icon, Spinner],
  templateUrl: './verify-email.page.html',
  styleUrl: './verify-email.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailPage {
  private readonly session = inject(SESSION_STORE);
  private readonly route = inject(ActivatedRoute);

  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  protected readonly state = signal<VerifyState>('verifying');
  protected readonly error = signal<AuthError | null>(null);
  protected readonly resent = signal(false);
  protected readonly busy = signal(false);

  protected readonly email = computed(
    () => this.route.snapshot.queryParamMap.get('email') ?? this.session.user()?.email ?? '',
  );
  protected readonly maskedEmail = computed(() => maskEmail(this.email() || 'your inbox'));
  protected readonly sentSubtitle = computed(
    () => `We sent a verification link to ${this.maskedEmail()}. It works for 24 hours.`,
  );

  constructor() {
    const dev = devState(this.route);
    if (dev && (STATES as readonly string[]).includes(dev)) {
      this.state.set(dev as VerifyState);
      return;
    }
    if (!this.token) {
      this.state.set('sent');
      return;
    }
    void this.verify();
  }

  private async verify(): Promise<void> {
    try {
      await this.session.verifyEmail({ token: this.token });
      this.state.set('verified');
    } catch (e) {
      const error = e as AuthError;
      if (error.code === 'email_already_verified') {
        this.state.set('verified');
        return;
      }
      this.error.set(error);
      this.state.set('expired');
    }
  }

  protected async resend(): Promise<void> {
    if (this.busy() || this.resent() || !this.email()) return;
    this.busy.set(true);
    try {
      await this.session.resendVerification({ email: this.email() });
      this.resent.set(true);
      setTimeout(() => this.resent.set(false), 60_000);
    } catch (e) {
      this.error.set(e as AuthError);
    } finally {
      this.busy.set(false);
    }
  }
}
