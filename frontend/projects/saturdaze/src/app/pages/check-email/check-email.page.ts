import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { SESSION_STORE } from 'api';
import { AuthCard, AuthShell, Button, Icon } from 'components';

/**
 * Post-send confirmation — `pages/check-email.html`. Reached after
 * `/signup` (verify your inbox) and `/forgot-password` (reset link sent).
 *
 * The resend button re-calls `SessionStore.forgotPassword` for the stored
 * email. For sign-up flows the resend is a no-op stub — production wiring
 * lands once the backend exposes a resend endpoint.
 */
@Component({
  selector: 'app-check-email',
  standalone: true,
  imports: [RouterLink, AuthShell, AuthCard, Button, Icon],
  templateUrl: './check-email.page.html',
  styleUrl: './check-email.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckEmailPage {
  private readonly session = inject(SESSION_STORE);
  private readonly router = inject(Router);

  protected readonly resending = signal(false);
  protected readonly resentAt = signal<number | null>(null);

  protected async resend(): Promise<void> {
    if (this.resending()) return;
    this.resending.set(true);
    try {
      const email = this.session.user()?.email ?? '';
      if (email) await this.session.forgotPassword({ email });
      this.resentAt.set(Date.now());
    } finally {
      this.resending.set(false);
    }
  }

  protected useDifferent(): void {
    void this.router.navigateByUrl('/signup');
  }
}
