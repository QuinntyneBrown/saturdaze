import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthError, SESSION_STORE } from 'api';
import { AuthCard, AuthShell, Button, Icon } from 'components';

type VerifyState = 'pending' | 'success' | 'error';

/**
 * Email verification — `pages/verify-email.html`.
 *
 * On mount, reads `?token=` and calls `SessionStore.verifyEmail()`. Renders
 * three states: pending (spinner), success (verified card), error (invalid
 * or already-verified token).
 */
@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink, AuthShell, AuthCard, Button, Icon],
  templateUrl: './verify-email.page.html',
  styleUrl: './verify-email.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailPage {
  private readonly session = inject(SESSION_STORE);
  private readonly route = inject(ActivatedRoute);

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly token = computed(() => this.queryParams().get('token') ?? '');
  protected readonly state = signal<VerifyState>('pending');
  protected readonly error = signal<AuthError | null>(null);

  constructor() {
    void this.verify();
  }

  private async verify(): Promise<void> {
    const token = this.token();
    if (!token) {
      this.error.set({ code: 'token_invalid', message: 'Verification link is missing a token.' });
      this.state.set('error');
      return;
    }
    try {
      await this.session.verifyEmail({ token });
      this.state.set('success');
    } catch (e) {
      this.error.set(e as AuthError);
      this.state.set('error');
    }
  }
}
